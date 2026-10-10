import React, { useRef, useState } from "react";
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
import {
  getMonthsBack,
  getRecordedMonths,
  getReferenceMonth,
  getSavingsTrend,
  toMonthIndex,
} from "../../../helpers/savingsTrend/savingsTrend";
import type {
  PresetId,
  TrendRange,
} from "../../../helpers/savingsTrend/savingsTrend.types";
import RangeSwitch from "./RangeSwitch";
import TrendSummary from "./TrendSummary";
import TrendChart from "./TrendChart";
import CustomRangeSheet from "./CustomRangeSheet";
import "./styles.scss";

interface SavingsTrendProps {
  entries: EntriesTree;
  selectedDate: MonthDate;
  onSelectedDateChange: (date: MonthDate) => void;
}

const DEFAULT_RANGE: TrendRange = { kind: "preset", id: "6M" };

/**
 * The Savings trend screen: is the selected month's savings growing against an
 * earlier month? A range picker (1M … YTD or a custom span in whole months), a
 * headline with the amount and percentage, and a line chart of the months in
 * between (design/features/savings-trend/ui/approved/).
 */
const SavingsTrend = ({
  entries,
  selectedDate,
  onSelectedDateChange,
}: SavingsTrendProps) => {
  const { t } = useTranslation();
  const [requested, setRequested] = useState<TrendRange>(DEFAULT_RANGE);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const customButtonRef = useRef<HTMLButtonElement>(null);

  const monthsBack = getMonthsBack(entries, selectedDate, requested);
  const trend =
    monthsBack === null
      ? null
      : getSavingsTrend(entries, selectedDate, monthsBack);

  const closeSheet = () => {
    setIsSheetOpen(false);
    customButtonRef.current?.focus();
  };
  const applyCustomRange = ({ from, to }: { from: MonthDate; to: MonthDate }) => {
    setRequested({
      kind: "custom",
      monthsBack: toMonthIndex(to) - toMonthIndex(from),
    });
    if (toMonthIndex(to) !== toMonthIndex(selectedDate)) {
      onSelectedDateChange({ year: to.year, month: to.month });
    }
    closeSheet();
  };
  const selectPreset = (id: PresetId) => setRequested({ kind: "preset", id });

  return (
    <MainContentContainer
      className="savings-trend"
      pageTitle={t("savingsTrend.pageTitle")}
    >
      <NavigableMonthHeader />
      <RangeSwitch
        end={selectedDate}
        active={requested}
        isCustomDisabled={!trend}
        onSelectPreset={selectPreset}
        onOpenCustom={() => setIsSheetOpen(true)}
        customButtonRef={customButtonRef}
      />
      {trend ? (
        <>
          <TrendSummary trend={trend} />
          <TrendChart
            key={`${trend.reference.year}-${trend.reference.month}-${selectedDate.year}-${selectedDate.month}`}
            points={trend.points}
          />
        </>
      ) : (
        <div className="savings-trend__empty">
          <span className="savings-trend__empty-title">
            {t("savingsTrend.empty.title")}
          </span>
          <span className="savings-trend__empty-body">
            {t("savingsTrend.empty.body")}
          </span>
        </div>
      )}
      {trend && monthsBack !== null && isSheetOpen && (
        <CustomRangeSheet
          months={getRecordedMonths(entries)}
          initialFrom={getReferenceMonth(selectedDate, monthsBack)}
          initialTo={selectedDate}
          onApply={applyCustomRange}
          onClose={closeSheet}
        />
      )}
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
