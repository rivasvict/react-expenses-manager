import React from "react";
import { useTranslation } from "../../../../i18n";
import {
  formatPercent,
  MonthDate,
} from "../../../../helpers/savingsChange/savingsChange";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import type { SavingsTrend } from "../../../../helpers/savingsTrend/savingsTrend.types";
import {
  formatSavings,
  formatSignedSavings,
} from "../../../../helpers/savingsTrend/formatters";
import ChangePill from "../../ChangePill";
import "./styles.scss";

interface TrendSummaryProps {
  trend: SavingsTrend;
}

const hasYear = (first: MonthDate, last: MonthDate) => first.year !== last.year;

/**
 * The card above the chart: "October vs April", the amount the end month moved
 * by and, when it can be compared, the percentage.
 */
const TrendSummary = ({ trend }: TrendSummaryProps) => {
  const { t, language } = useTranslation();
  const { reference, end, difference, change } = trend;
  const withYear = hasYear(reference, end);
  const name = (date: MonthDate, style: "title" | "sentence") =>
    `${getMonthLabel(date.month, language, style)}${withYear ? ` ${date.year}` : ""}`;
  const label = t("savingsTrend.compare", {
    end: name(end, "title"),
    reference: name(reference, "sentence"),
  });
  const tone = difference > 0 ? "up" : difference < 0 ? "down" : "flat";
  return (
    <div className="trend-summary" role="group" aria-label={label}>
      <span className="trend-summary__label">{label}</span>
      <span className={`trend-summary__amount trend-summary__amount--${tone}`}>
        {formatSignedSavings(difference)}
      </span>
      <span className="trend-summary__delta">
        {change.kind !== "none" && (
          <ChangePill kind={change.kind} percent={formatPercent(change.percent)} />
        )}
        <span className="trend-summary__caption">
          {t("savingsTrend.compare", {
            end: formatSavings(end.savings),
            reference: formatSavings(reference.savings),
          })}
        </span>
      </span>
    </div>
  );
};

export default TrendSummary;
