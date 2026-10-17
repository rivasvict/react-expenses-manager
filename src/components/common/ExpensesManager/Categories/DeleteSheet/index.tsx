import React, { useMemo, useState } from "react";
import { Button } from "react-bootstrap";
import BottomSheet from "../../../BottomSheet";
import Callout from "../../../Callout";
import CategorySearchSelect from "../../../CategorySearchSelect";
import AffectedEntryRow from "./AffectedEntryRow";
import { groupAffectedEntries } from "./groupAffectedEntries";
import { AffectedEntry } from "../../../../../helpers/categoryChanges/categoryChanges";
import { CategoryType } from "../../../../../helpers/categoryLists/categoryLists";
import { formatCurrency } from "../../../../../helpers/currency/currency";
import { getMonthLabel } from "../../../../../helpers/savingsTrend/monthLabels";
import { Trans, useTranslation } from "../../../../../i18n";
import "./styles.scss";

interface DeleteSheetProps {
  type: CategoryType;
  name: string;
  entries: AffectedEntry[];
  /** The bucket's current monthly limit; undefined when it has none. */
  bucketLimit?: number;
  /** The other categories of the same type, in display order. */
  options: string[];
  onConfirm: (moves: { [id: string]: string }) => Promise<unknown>;
  onClose: () => void;
}

const bold = { b: (text: string) => <b>{text}</b> };

/**
 * Deletes a category that entries use: the irreversible-change warning, "Set
 * every expense to … / Apply to all", then every affected entry grouped by
 * month with its own category select. The list scrolls; the count still to
 * assign and the Delete button stay at the sheet's foot, and Delete stays
 * unavailable until every entry has a category.
 */
const DeleteSheet = ({
  type,
  name,
  entries,
  bucketLimit,
  options,
  onConfirm,
  onClose,
}: DeleteSheetProps) => {
  const { t, plural, pluralKey, language } = useTranslation();
  const [assigned, setAssigned] = useState<{ [id: string]: string }>({});
  const [applyAllChoice, setApplyAllChoice] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const groups = useMemo(() => groupAffectedEntries(entries), [entries]);
  const isIncome = type === "income";
  const hasBucket = bucketLimit !== undefined;
  const remaining = entries.filter((entry) => !assigned[entry.id]).length;

  const warningKey = isIncome
    ? pluralKey("deleteSheet.warningIncome", entries.length)
    : hasBucket
      ? pluralKey("deleteSheet.warningBucket", entries.length)
      : pluralKey("deleteSheet.warning", entries.length);

  const applyToAll = () => {
    if (!applyAllChoice) return;
    setAssigned(
      Object.fromEntries(entries.map((entry) => [entry.id, applyAllChoice]))
    );
  };

  const confirm = async () => {
    if (remaining > 0 || isDeleting) return;
    setIsDeleting(true);
    setFailed(false);
    try {
      await onConfirm(assigned);
      onClose();
    } catch (deleteError) {
      setFailed(true);
      setIsDeleting(false);
    }
  };

  const footer = (
    <>
      {remaining > 0 && (
        <p className="delete-sheet__remaining" role="status">
          {plural(
            isIncome ? "deleteSheet.stillNeedIncome" : "deleteSheet.stillNeed",
            remaining
          )}
        </p>
      )}
      {failed && (
        <p className="delete-sheet__remaining" role="alert">
          {t("deleteSheet.deleteFailed")}
        </p>
      )}
      <Button
        variant="danger"
        type="button"
        aria-disabled={remaining > 0 || isDeleting}
        onClick={confirm}
      >
        {plural(
          isIncome ? "deleteSheet.confirmIncome" : "deleteSheet.confirm",
          entries.length
        )}
      </Button>
    </>
  );

  return (
    <BottomSheet
      className="category-sheet"
      variant="tall"
      role="alertdialog"
      title={t("deleteSheet.title", { name })}
      closeLabel={t("categories.sheetClose")}
      onClose={onClose}
      footer={footer}
    >
      <div className="category-sheet__content">
        <Callout tone="danger">
          <Trans
            i18nKey={warningKey}
            params={{
              count: entries.length,
              ...(hasBucket
                ? { amount: formatCurrency(bucketLimit as number) }
                : {}),
            }}
            components={bold}
          />
        </Callout>
        <div>
          <label
            className="form-label"
            id="delete-set-all-label"
            htmlFor="delete-set-all"
          >
            {isIncome
              ? t("deleteSheet.setAllIncomes")
              : t("deleteSheet.setAllExpenses")}
          </label>
          <div className="delete-sheet__apply-all">
            <CategorySearchSelect
              id="delete-set-all"
              name={
                isIncome
                  ? t("deleteSheet.setAllIncomes")
                  : t("deleteSheet.setAllExpenses")
              }
              className={`delete-sheet__set-all${applyAllChoice ? "" : " delete-sheet__set-all--empty"}`}
              value={applyAllChoice}
              options={options.map((option) => ({
                value: option,
                label: option,
              }))}
              emptyOptionLabel={t("deleteSheet.chooseCategory")}
              onChange={setApplyAllChoice}
            />
            <Button
              variant="secondary"
              type="button"
              className="delete-sheet__apply-button"
              aria-disabled={!applyAllChoice}
              onClick={applyToAll}
            >
              {t("deleteSheet.applyAll")}
            </Button>
          </div>
        </div>
        {groups.map((group) => (
          <section className="delete-sheet__group" key={group.key}>
            <h3 className="category-sheet__group-label">
              <span>
                {group.month
                  ? t("deleteSheet.monthGroup", {
                      month: getMonthLabel(group.month.month, language),
                      year: group.month.year,
                    })
                  : t("deleteSheet.recurring")}
              </span>
              <span>{group.entries.length}</span>
            </h3>
            <div className="delete-sheet__list">
              {group.entries.map((entry) => (
                <AffectedEntryRow
                  key={entry.id}
                  entry={entry}
                  options={options}
                  value={assigned[entry.id] || ""}
                  onChange={(category) =>
                    setAssigned((previous) => ({
                      ...previous,
                      [entry.id]: category,
                    }))
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </BottomSheet>
  );
};

export default DeleteSheet;
