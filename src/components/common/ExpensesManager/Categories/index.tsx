import React, { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import dayjs from "dayjs";
import { MainContentContainer } from "../../MainContentContainer";
import UnderlineTabs from "../../UnderlineTabs";
import CategoryRow from "./CategoryRow";
import EmptyState from "./EmptyState";
import AddCategorySheet from "./AddCategorySheet";
import CategorySheet from "./CategorySheet";
import DeleteSheet from "./DeleteSheet";
import DeleteUnusedSheet from "./DeleteUnusedSheet";
import DeleteBlockedSheet from "./DeleteBlockedSheet";
import {
  addCategory,
  deleteCategory,
  renameCategory,
} from "../../../../redux/expensesManager/actionCreators";
import {
  CategoryLists,
  CategoryType,
  findCategoryName,
  sortCategoryNames,
} from "../../../../helpers/categoryLists/categoryLists";
import {
  CategoryUsage,
  getCategoryUsage,
} from "../../../../helpers/categoryUsage/categoryUsage";
import {
  getActiveLimitForMonth,
  toYearMonth,
} from "../../../../helpers/entriesHelper/entriesHelper";
import { formatCurrency } from "../../../../helpers/currency/currency";
import { useTranslation } from "../../../../i18n";
import "./styles.scss";

type OpenSheet =
  | { kind: "add"; type: CategoryType }
  | { kind: "category" | "delete"; type: CategoryType; name: string }
  | null;

/** Router state that opens the add sheet on arrival (the old /add-category). */
export interface CategoriesLocationState {
  addCategory?: CategoryType;
}

interface CategoriesProps {
  categoryLists: CategoryLists;
  buckets: { [name: string]: any };
  entries: any;
  fixedEntries: any[];
  onAddCategory: (payload: { type: CategoryType; name: string }) => Promise<unknown>;
  onRenameCategory: (payload: {
    type: CategoryType;
    name: string;
    newName: string;
  }) => Promise<unknown>;
  onDeleteCategory: (payload: {
    type: CategoryType;
    name: string;
    moves?: { [id: string]: string };
  }) => Promise<unknown>;
}

const ADD_TARGET = "\u0000add";

/**
 * Categories (design/features/category-management/ui/): the user's expense
 * and income categories under two tabs, each row showing how much it is used.
 * Tapping a row opens its sheet (usage, rename, delete); deleting a category
 * entries use asks where each of them goes. An empty type shows an
 * illustration and the add action.
 */
const Categories = ({
  categoryLists,
  buckets,
  entries,
  fixedEntries,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: CategoriesProps) => {
  const { t, plural, language } = useTranslation();
  const history = useHistory();
  const location = useLocation<CategoriesLocationState | undefined>();
  const [activeType, setActiveType] = useState<CategoryType>(
    location.state?.addCategory || "expense"
  );
  const [sheet, setSheet] = useState<OpenSheet>(
    location.state?.addCategory
      ? { kind: "add", type: location.state.addCategory }
      : null
  );
  const rowRefs = useRef<{ [name: string]: HTMLButtonElement | null }>({});
  const addButtonRef = useRef<HTMLButtonElement>(null);
  // What gets focus back once a sheet closes: a row's name or the add button.
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (sheet || pendingFocus.current === null) return;
    const target =
      pendingFocus.current === ADD_TARGET
        ? addButtonRef.current
        : rowRefs.current[pendingFocus.current];
    pendingFocus.current = null;
    target?.focus();
  });

  const names = useMemo(
    () => sortCategoryNames(categoryLists[activeType] || [], language),
    [categoryLists, activeType, language]
  );

  const thisMonth = toYearMonth(dayjs().year(), dayjs().month());
  const bucketLimitOf = (type: CategoryType, name: string) => {
    if (type !== "expense") return undefined;
    const bucketName = findCategoryName(Object.keys(buckets || {}), name);
    return bucketName
      ? getActiveLimitForMonth(buckets[bucketName], thisMonth)
      : undefined;
  };
  const usageOf = (type: CategoryType, name: string): CategoryUsage =>
    getCategoryUsage({ entries, fixedEntries }, type, name);

  const rowMeta = (name: string) => {
    const { count } = usageOf(activeType, name);
    const limit = bucketLimitOf(activeType, name);
    const usage =
      count > 0
        ? plural(
            activeType === "income"
              ? "categories.incomeCount"
              : "categories.expenseCount",
            count
          )
        : t("categories.unused");
    return limit === undefined
      ? usage
      : `${usage} · ${t("categories.bucketPerMonth", {
          amount: formatCurrency(limit),
        })}`;
  };

  const closeSheet = (focusName?: string) => {
    if (pendingFocus.current === null) {
      pendingFocus.current =
        focusName ?? (sheet && sheet.kind !== "add" ? sheet.name : ADD_TARGET);
    }
    setSheet(null);
  };

  const openAdd = (type: CategoryType) => {
    setActiveType(type);
    setSheet({ kind: "add", type });
  };

  const renderSheet = () => {
    if (!sheet) return null;
    if (sheet.kind === "add") {
      return (
        <AddCategorySheet
          type={sheet.type}
          categoryLists={categoryLists}
          onCreate={async (name) => {
            await onAddCategory({ type: sheet.type, name });
            pendingFocus.current = name;
          }}
          onClose={() => closeSheet()}
        />
      );
    }
    const { type, name } = sheet;
    const usage = usageOf(type, name);
    const bucketLimit = bucketLimitOf(type, name);
    if (sheet.kind === "category") {
      return (
        <CategorySheet
          type={type}
          name={name}
          usage={usage}
          bucketLimit={bucketLimit}
          categoryLists={categoryLists}
          onSave={async (newName) => {
            await onRenameCategory({ type, name, newName });
            pendingFocus.current = newName;
          }}
          onDelete={() => setSheet({ kind: "delete", type, name })}
          onClose={() => closeSheet()}
        />
      );
    }
    const others = sortCategoryNames(
      (categoryLists[type] || []).filter(
        (other) => other.toLowerCase() !== name.toLowerCase()
      ),
      language
    );
    const deleteAndReturnToList = async (moves?: { [id: string]: string }) => {
      await onDeleteCategory({ type, name, moves });
      pendingFocus.current = ADD_TARGET;
    };
    if (usage.count === 0) {
      return (
        <DeleteUnusedSheet
          name={name}
          onConfirm={() => deleteAndReturnToList()}
          onClose={() => closeSheet()}
        />
      );
    }
    if (others.length === 0) {
      return (
        <DeleteBlockedSheet
          type={type}
          name={name}
          count={usage.count}
          onAddCategory={() => openAdd(type)}
          onClose={() => closeSheet()}
        />
      );
    }
    return (
      <DeleteSheet
        key={`${type}:${name}`}
        type={type}
        name={name}
        entries={usage.entries}
        bucketLimit={bucketLimit}
        options={others}
        onConfirm={deleteAndReturnToList}
        onClose={() => closeSheet()}
      />
    );
  };

  return (
    <MainContentContainer className="categories">
      <h1 className="categories__title">{t("categories.pageTitle")}</h1>
      <UnderlineTabs<CategoryType>
        className="categories__tabs"
        ariaLabel={t("categories.tabsLabel")}
        tabs={[
          {
            id: "expense",
            label: t("categories.tabExpenses"),
            badge: (categoryLists.expense || []).length,
          },
          {
            id: "income",
            label: t("categories.tabIncomes"),
            badge: (categoryLists.income || []).length,
          },
        ]}
        active={activeType}
        onChange={setActiveType}
      />
      {names.length > 0 ? (
        <>
          <p className="categories__lead">{t("categories.lead")}</p>
          <div className="categories__list">
            {names.map((name) => (
              <CategoryRow
                key={name}
                ref={(node) => {
                  rowRefs.current[name] = node;
                }}
                type={activeType}
                name={name}
                meta={rowMeta(name)}
                onOpen={() =>
                  setSheet({ kind: "category", type: activeType, name })
                }
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState type={activeType} />
      )}
      <div className="categories__actions">
        <Button
          variant="primary"
          ref={addButtonRef}
          onClick={() => openAdd(activeType)}
        >
          {activeType === "income"
            ? t("categories.addIncome")
            : t("categories.addExpense")}
        </Button>
        <Button variant="secondary" onClick={() => history.goBack()}>
          {t("common.goBack")}
        </Button>
      </div>
      {renderSheet()}
    </MainContentContainer>
  );
};

const mapStateToProps = (state: any) => ({
  categoryLists: state.expensesManager.categoryLists,
  buckets: state.expensesManager.buckets,
  entries: state.expensesManager.entries,
  fixedEntries: state.expensesManager.fixedEntries,
});

const mapActionsToProps = (dispatch: any) => ({
  onAddCategory: (payload: { type: CategoryType; name: string }) =>
    dispatch(addCategory(payload)),
  onRenameCategory: (payload: {
    type: CategoryType;
    name: string;
    newName: string;
  }) => dispatch(renameCategory(payload)),
  onDeleteCategory: (payload: {
    type: CategoryType;
    name: string;
    moves?: { [id: string]: string };
  }) => dispatch(deleteCategory(payload)),
});

export default connect(mapStateToProps, mapActionsToProps)(Categories);
