import React, { useState } from "react";
import { connect } from "react-redux";
import type { Dispatch } from "redux";
import { useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "../../../i18n";
import { MainContentContainer } from "../MainContentContainer";
import { NavigableMonthHeader } from "../NavigableMonthHeader";
import UnderlineTabs from "../UnderlineTabs";
import { setSelectedDate } from "../../../redux/expensesManager/actionCreators";
import type { EntriesTree, MonthDate } from "../../../helpers/savingsChange/savingsChange";
import {
  CATEGORY_TYPES,
  CategoryLists,
  CategoryType,
  isCategoryType,
} from "../../../helpers/categoryLists/categoryLists";
import { getRankedCategoryTrends } from "../../../helpers/categoryTrends/categoryTrends";
import { getReferenceMonth } from "../../../helpers/savingsTrend/savingsTrend";
import { getMonthLabel } from "../../../helpers/savingsTrend/monthLabels";
import ScopeSwitch from "../SavingsTrend/ScopeSwitch";
import RangeControls from "../SavingsTrend/RangeControls";
import RangeNotice from "../SavingsTrend/RangeNotice";
import HistoryNotice from "../SavingsTrend/HistoryNotice";
import { useTrendRange } from "../SavingsTrend/TrendRangeContext";
import TypeChip from "../ExpensesManager/Categories/TypeChip";
import MoverRow from "./MoverRow";
import "./styles.scss";

/** Router state that opens the list on a type (the detail's back link). */
export interface CategoryTrendsLocationState {
  type?: CategoryType;
}

interface CategoryTrendsProps {
  entries: EntriesTree;
  selectedDate: MonthDate;
  categoryLists: CategoryLists;
  onSelectedDateChange: (date: MonthDate) => void;
}

const TAB_LABELS = {
  expense: "categories.tabExpenses",
  income: "categories.tabIncomes",
} as const;

/**
 * The Categories view of the trend screens (design/features/category-trends/
 * ui/approved/): the same month and range as Savings, Expenses / Incomes tabs,
 * and the categories of that type ranked by how much they changed between the
 * range's first month and the end month. A row opens that category's trend.
 */
const CategoryTrends = ({
  entries,
  selectedDate,
  categoryLists,
  onSelectedDateChange,
}: CategoryTrendsProps) => {
  const { t, language } = useTranslation();
  const history = useHistory();
  const location = useLocation<CategoryTrendsLocationState | undefined>();
  const [type, setType] = useState<CategoryType>(
    isCategoryType(location.state?.type) ? location.state!.type : "expense"
  );
  // The tab is kept in this history entry too, so Back from a category
  // returns to it.
  const showType = (next: CategoryType) => {
    setType(next);
    history.replace({ ...location, state: { ...location.state, type: next } });
  };
  const range = useTrendRange(entries, selectedDate);
  const { resolved } = range;
  const monthsBack = resolved.status === "ready" ? resolved.monthsBack : null;
  const trends =
    monthsBack === null
      ? []
      : getRankedCategoryTrends(entries, categoryLists, type, selectedDate, monthsBack);
  const reference = monthsBack === null ? null : getReferenceMonth(selectedDate, monthsBack);
  const withYear = reference !== null && reference.year !== selectedDate.year;
  const monthName = (date: MonthDate, style: "title" | "sentence") =>
    `${getMonthLabel(date.month, language, style)}${withYear ? ` ${date.year}` : ""}`;

  return (
    <MainContentContainer className="category-trends">
      <h3 className="visually-hidden">{t("categoryTrends.pageTitle")}</h3>
      <ScopeSwitch active="categories" />
      <NavigableMonthHeader />
      <RangeControls
        entries={entries}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        range={range}
      />
      <RangeNotice range={range} />
      {reference && (
        <>
          <UnderlineTabs<CategoryType>
            className="category-trends__tabs"
            ariaLabel={t("categories.tabsLabel")}
            tabs={CATEGORY_TYPES.map((id) => ({ id, label: t(TAB_LABELS[id]) }))}
            active={type}
            onChange={showType}
          />
          {trends.length > 0 ? (
            <>
              <p className="category-trends__subtitle">
                {t("categoryTrends.subtitle", {
                  end: monthName(selectedDate, "title"),
                  reference: monthName(reference, "sentence"),
                })}
              </p>
              <div className="category-trends__list">
                {trends.map((trend) => (
                  <MoverRow
                    key={trend.name}
                    trend={trend}
                    reference={monthName(reference, "sentence")}
                  />
                ))}
              </div>
              <p className="category-trends__hint">{t("categoryTrends.hint")}</p>
            </>
          ) : (
            <HistoryNotice
              icon={<TypeChip type={type} />}
              title={t(`categoryTrends.empty.${type}.title`, {
                from: monthName(reference, "sentence"),
                to: monthName(selectedDate, "sentence"),
              })}
              body={t(`categoryTrends.empty.${type}.body`)}
            />
          )}
        </>
      )}
    </MainContentContainer>
  );
};

export const mapStateToProps = (state: {
  expensesManager: {
    entries: EntriesTree;
    selectedDate: MonthDate;
    categoryLists: CategoryLists;
    categoryListsLoaded: boolean;
  };
}) => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate,
  categoryLists: state.expensesManager.categoryLists,
  categoryListsLoaded: state.expensesManager.categoryListsLoaded,
});

export const mapActionsToProps = (dispatch: Dispatch) => ({
  onSelectedDateChange: (newSelectedDate: MonthDate) =>
    dispatch(setSelectedDate(newSelectedDate)),
});

export default connect(mapStateToProps, mapActionsToProps)(CategoryTrends);
