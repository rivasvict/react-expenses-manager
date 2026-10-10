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
  getDefaultRange,
  getRecordedMonths,
  getReferenceMonth,
  getSavingsTrend,
  resolveRange,
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
import HistoryNotice from "./HistoryNotice";
import { getMonthLabel } from "../../../helpers/savingsTrend/monthLabels";

interface SavingsTrendProps {
  entries: EntriesTree;
  selectedDate: MonthDate;
  onSelectedDateChange: (date: MonthDate) => void;
}

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
  const { t, language } = useTranslation();
  // Until the user picks a range it is 6M, or the longest the history reaches.
  const [picked, setPicked] = useState<TrendRange | null>(null);
  const requested = picked ?? getDefaultRange(entries, selectedDate);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const customButtonRef = useRef<HTMLButtonElement>(null);

  const resolved = resolveRange(entries, selectedDate, requested);
  const trend =
    resolved.status === "ready"
      ? getSavingsTrend(entries, selectedDate, resolved.monthsBack)
      : null;

  const closeSheet = () => {
    setIsSheetOpen(false);
    customButtonRef.current?.focus();
  };
  const applyCustomRange = ({ from, to }: { from: MonthDate; to: MonthDate }) => {
    setPicked({
      kind: "custom",
      monthsBack: toMonthIndex(to) - toMonthIndex(from),
    });
    if (toMonthIndex(to) !== toMonthIndex(selectedDate)) {
      onSelectedDateChange({ year: to.year, month: to.month });
    }
    closeSheet();
  };
  const monthName = (date: MonthDate) =>
    `${getMonthLabel(date.month, language, "sentence")} ${date.year}`;
  const selectPreset = (id: PresetId) => setPicked({ kind: "preset", id });

  return (
    <MainContentContainer
      className="savings-trend"
      pageTitle={t("savingsTrend.pageTitle")}
    >
      <NavigableMonthHeader />
      <RangeSwitch
        end={selectedDate}
        active={requested}
        isCustomDisabled={resolved.status === "empty"}
        onSelectPreset={selectPreset}
        onOpenCustom={() => setIsSheetOpen(true)}
        customButtonRef={customButtonRef}
      />
      {trend && (
        <>
          <TrendSummary trend={trend} />
          <TrendChart
            key={`${trend.reference.year}-${trend.reference.month}-${selectedDate.year}-${selectedDate.month}`}
            points={trend.points}
          />
        </>
      )}
      {resolved.status === "short" && (
        <HistoryNotice
          title={t("savingsTrend.short.title")}
          body={t("savingsTrend.short.body", {
            month: monthName(resolved.earliest),
          })}
          action={{
            label: t("savingsTrend.short.action", {
              month: monthName(resolved.earliest),
            }),
            onClick: () =>
              setPicked({ kind: "custom", monthsBack: resolved.monthsBack }),
          }}
        />
      )}
      {resolved.status === "empty" && (
        <HistoryNotice
          title={t("savingsTrend.empty.title")}
          body={t("savingsTrend.empty.body")}
        />
      )}
      {trend && resolved.status === "ready" && isSheetOpen && (
        <CustomRangeSheet
          months={getRecordedMonths(entries)}
          initialFrom={getReferenceMonth(selectedDate, resolved.monthsBack)}
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
