import React from "react";
import { useTranslation } from "../../../../i18n";
import {
  formatPercent,
  MonthDate,
} from "../../../../helpers/savingsChange/savingsChange";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import { getTotalSaved } from "../../../../helpers/savingsTrend/savingsTotal";
import type { SavingsTrend } from "../../../../helpers/savingsTrend/savingsTrend.types";
import {
  formatSavings,
  formatSignedSavings,
} from "../../../../helpers/savingsTrend/formatters";
import ChangePill from "../../ChangePill";
import TotalFigures from "../TotalFigures";
import ViewTabs, { TrendView } from "../ViewTabs";
import "./styles.scss";

interface TrendSummaryProps {
  trend: SavingsTrend;
  /** Which tab's figures the card shows; the card is the Change one by default. */
  view?: TrendView;
  /** When given, the Total saved / Change tabs are shown at the top of the card. */
  onViewChange?: (view: TrendView) => void;
}

const hasYear = (first: MonthDate, last: MonthDate) => first.year !== last.year;

/**
 * The card above the chart. Its tabs pick what it shows: the total saved over
 * the range ("Total saved, Apr – Oct") or the change ("October vs April", the
 * amount the end month moved by and, when it can be compared, the percentage).
 * One card holds both so the tabs keep their focus when switching.
 */
const TrendSummary = ({
  trend,
  view = "change",
  onViewChange,
}: TrendSummaryProps) => {
  const { t, language } = useTranslation();
  const { reference, end, difference, change } = trend;
  const withYear = hasYear(reference, end);
  const name = (
    date: MonthDate,
    style: "title" | "sentence" | "short"
  ) => `${getMonthLabel(date.month, language, style)}${withYear ? ` ${date.year}` : ""}`;
  const changeLabel = t("savingsTrend.compare", {
    end: name(end, "title"),
    reference: name(reference, "sentence"),
  });
  const totalLabel = t("savingsTrend.total.label", {
    span: `${name(reference, "short")} – ${name(end, "short")}`,
  });
  const label = view === "total" ? totalLabel : changeLabel;
  const tone = difference > 0 ? "up" : difference < 0 ? "down" : "flat";
  return (
    <div className="trend-summary" role="group" aria-label={label}>
      {onViewChange && <ViewTabs active={view} onChange={onViewChange} />}
      {view === "total" ? (
        <TotalFigures label={totalLabel} {...getTotalSaved(trend.points)} />
      ) : (
        <>
          <span className="trend-summary__label">{changeLabel}</span>
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
        </>
      )}
    </div>
  );
};

export default TrendSummary;
