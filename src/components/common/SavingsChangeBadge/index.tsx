import React from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useTranslation } from "../../../i18n";
import {
  EntriesTree,
  formatPercent,
  getPreviousMonth,
  getSavingsChange,
  MonthDate,
} from "../../../helpers/savingsChange/savingsChange";
import "./styles.scss";

type ChangeKind = "up" | "down" | "flat";

// The arrow and the sign carry the direction, so colour is never the only cue.
const SIGNS: Record<ChangeKind, string> = { up: "+", down: "−", flat: "" };

const ICON_PATHS: Record<ChangeKind, string> = {
  up: "M6 1.5 10.5 6.5H7.4V10.5H4.6V6.5H1.5Z",
  down: "M6 10.5 1.5 5.5H4.6V1.5H7.4V5.5H10.5Z",
  flat: "M2 5h8v2H2Z",
};

const LABEL_KEYS = {
  up: "savingsChange.label.up",
  down: "savingsChange.label.down",
  flat: "savingsChange.label.flat",
} as const;

// A month name as it reads mid-sentence: "September", "septiembre". Pinned to
// the 1st so a long current month never rolls over (Jan 31 → "March").
const getMonthNameInSentence = (month: number, language: string) =>
  dayjs().date(1).month(month).locale(language).format("MMMM");

interface SavingsChangeBadgeProps {
  entries: EntriesTree;
  selectedDate: MonthDate;
}

/**
 * How the selected month's savings changed against the previous month: a
 * green ▲ / red ▼ percentage pill and a "vs <month>" caption, shown under the
 * dashboard's savings amount (design/features/savings-delta/ui/approved/).
 */
const SavingsChangeBadge = ({
  entries,
  selectedDate,
}: SavingsChangeBadgeProps) => {
  const { t, language } = useTranslation();
  const change = getSavingsChange(entries, selectedDate);
  const month = getMonthNameInSentence(
    getPreviousMonth(selectedDate).month,
    language
  );

  if (change.kind === "none") {
    return (
      <span className="savings-change">
        <span className="savings-change__caption">
          {t("savingsChange.nothingToCompare", { month })}
        </span>
      </span>
    );
  }

  const percent = formatPercent(change.percent);
  return (
    <span
      className="savings-change"
      role="img"
      aria-label={t(LABEL_KEYS[change.kind], { percent, month })}
    >
      <span
        className={`savings-change__pill savings-change__pill--${change.kind}`}
        aria-hidden="true"
      >
        <svg className="savings-change__icon" viewBox="0 0 12 12">
          <path d={ICON_PATHS[change.kind]} />
        </svg>
        {SIGNS[change.kind]}
        {percent}
      </span>
      <span className="savings-change__caption" aria-hidden="true">
        {t("savingsChange.vs", { month })}
      </span>
    </span>
  );
};

export default SavingsChangeBadge;
