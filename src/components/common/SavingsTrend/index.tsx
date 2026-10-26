import React, { useState } from "react";
import { connect } from "react-redux";
import type { Dispatch } from "redux";
import { useTranslation } from "../../../i18n";
import { MainContentContainer } from "../MainContentContainer";
import { NavigableMonthHeader } from "../NavigableMonthHeader";
import { setSelectedDate } from "../../../redux/expensesManager/actionCreators";
import type {
  EntriesTree,
  MonthDate,
} from "../../../helpers/savingsChange/savingsChange";
import { getSavingsTrend } from "../../../helpers/savingsTrend/savingsTrend";
import TrendSummary from "./TrendSummary";
import type { TrendView } from "./ViewTabs";
import TrendChart from "./TrendChart";
import RangeNotice from "./RangeNotice";
import RangeControls from "./RangeControls";
import ScopeSwitch from "./ScopeSwitch";
import { useTrendRange } from "./TrendRangeContext";

interface SavingsTrendProps {
  entries: EntriesTree;
  selectedDate: MonthDate;
  onSelectedDateChange: (date: MonthDate) => void;
}

/**
 * The Savings trend screen: is the selected month's savings growing against an
 * earlier month? A range picker (1M … YTD or a custom span in whole months), a
 * headline card with Total saved (the default) and Change tabs, and a line chart
 * of the months in between (design/features/savings-trend/ui/approved/ and
 * design/features/savings-trend-total/ui/approved/). The Savings | Categories
 * switch on top opens the category trends
 * (design/features/category-trends/ui/approved/).
 */
const SavingsTrend = ({
  entries,
  selectedDate,
  onSelectedDateChange,
}: SavingsTrendProps) => {
  const { t } = useTranslation();
  const range = useTrendRange(entries, selectedDate);
  const { resolved } = range;
  // The screen opens on Total saved; the tab survives moving the month or range.
  const [view, setView] = useState<TrendView>("total");

  const trend =
    resolved.status === "ready"
      ? getSavingsTrend(entries, selectedDate, resolved.monthsBack)
      : null;

  return (
    <MainContentContainer className="savings-trend">
      <h3 className="visually-hidden">{t("savingsTrend.pageTitle")}</h3>
      <ScopeSwitch active="savings" />
      <NavigableMonthHeader />
      <RangeControls
        entries={entries}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
        range={range}
      />
      {trend && (
        <>
          <TrendSummary trend={trend} view={view} onViewChange={setView} />
          <TrendChart
            key={`${view}-${trend.reference.year}-${trend.reference.month}-${selectedDate.year}-${selectedDate.month}`}
            points={trend.points}
            mode={view}
          />
        </>
      )}
      <RangeNotice range={range} />
    </MainContentContainer>
  );
};

const mapStateToProps = (state: {
  expensesManager: { entries: EntriesTree; selectedDate: MonthDate };
}) => ({
  entries: state.expensesManager.entries,
  selectedDate: state.expensesManager.selectedDate,
});

const mapActionsToProps = (dispatch: Dispatch) => ({
  onSelectedDateChange: (newSelectedDate: MonthDate) =>
    dispatch(setSelectedDate(newSelectedDate)),
});

export default connect(mapStateToProps, mapActionsToProps)(SavingsTrend);
