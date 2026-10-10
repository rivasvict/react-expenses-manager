import React from "react";
import { useTranslation } from "../../../i18n";
import {
  EntriesTree,
  formatPercent,
  getPreviousMonth,
  getSavingsChange,
  MonthDate,
} from "../../../helpers/savingsChange/savingsChange";
import { getMonthLabel } from "../../../helpers/savingsTrend/monthLabels";
import ChangePill from "../ChangePill";
import "./styles.scss";

const LABEL_KEYS = {
  up: "savingsChange.label.up",
  down: "savingsChange.label.down",
  flat: "savingsChange.label.flat",
} as const;

interface SavingsChangeBadgeProps {
  entries: EntriesTree;
  selectedDate: MonthDate;
}

/**
 * How the selected month's savings changed against the previous month: a
 * green ▲ / red ▼ percentage pill and a "vs <month>" caption, shown in the
 * footer of the dashboard's savings card
 * (design/features/savings-trend/ui/approved/). The caption uses the short
 * month name ("vs Sep"); the spoken label keeps the full one.
 */
const SavingsChangeBadge = ({
  entries,
  selectedDate,
}: SavingsChangeBadgeProps) => {
  const { t, language } = useTranslation();
  const change = getSavingsChange(entries, selectedDate);
  const { month: previousMonth } = getPreviousMonth(selectedDate);
  const shortMonth = getMonthLabel(previousMonth, language, "short");

  if (change.kind === "none") {
    return (
      <span className="savings-change">
        <span className="savings-change__caption">
          {t("savingsChange.nothingToCompare", { month: shortMonth })}
        </span>
      </span>
    );
  }

  const percent = formatPercent(change.percent);
  const month = getMonthLabel(previousMonth, language, "sentence");
  return (
    <span
      className="savings-change"
      role="img"
      aria-label={t(LABEL_KEYS[change.kind], { percent, month })}
    >
      <ChangePill kind={change.kind} percent={percent} aria-hidden />
      <span className="savings-change__caption" aria-hidden="true">
        {t("savingsChange.vs", { month: shortMonth })}
      </span>
    </span>
  );
};

export default SavingsChangeBadge;
