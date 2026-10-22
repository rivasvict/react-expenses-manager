import React from "react";
import { useTranslation } from "../../../../i18n";
import type { MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import { formatPercent } from "../../../../helpers/savingsChange/savingsChange";
import type { CategoryTrend } from "../../../../helpers/categoryTrends/categoryTrends.types";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import {
  formatSavings,
  formatSignedSavings,
} from "../../../../helpers/savingsTrend/formatters";
import ChangePill from "../../ChangePill";
import UnderlineTabs from "../../UnderlineTabs";
import type { CategoryTrendView } from "../CategoryTrendChart";
import "../../SavingsTrend/TrendSummary/styles.scss";
import "../../SavingsTrend/ViewTabs/styles.scss";

const VIEWS: CategoryTrendView[] = ["perMonth", "change"];

// Good news reads green like a rise in savings; bad news red like a drop.
const AMOUNT_TONES = { good: "up", bad: "down", flat: "flat" } as const;

interface CategoryTrendSummaryProps {
  trend: CategoryTrend;
  view: CategoryTrendView;
  onViewChange: (view: CategoryTrendView) => void;
}

/**
 * The headline card of one category's trend, with Per month / Change tabs on
 * top: the total over the range and its monthly average, or the end month
 * against the reference month ("Eating out, October vs April").
 */
const CategoryTrendSummary = ({ trend, view, onViewChange }: CategoryTrendSummaryProps) => {
  const { t, plural, language } = useTranslation();
  const { name, reference, end, difference, change, tone } = trend;
  const withYear = reference.year !== end.year;
  const monthName = (date: MonthDate, style: "title" | "sentence" | "short") =>
    `${getMonthLabel(date.month, language, style)}${withYear ? ` ${date.year}` : ""}`;
  const label =
    view === "perMonth"
      ? t("categoryTrends.headline.perMonth", {
          category: name,
          span: `${monthName(reference, "short")} – ${monthName(end, "short")}`,
        })
      : t("categoryTrends.headline.change", {
          category: name,
          // Mid-sentence, after the category's name.
          end: monthName(end, "sentence"),
          reference: monthName(reference, "sentence"),
        });

  return (
    <div className="trend-summary" role="group" aria-label={label}>
      <UnderlineTabs
        className="view-tabs"
        ariaLabel={t("savingsTrend.view.group")}
        tabs={VIEWS.map((id) => ({
          id,
          label: t(id === "perMonth" ? "categoryTrends.view.perMonth" : "savingsTrend.view.change"),
        }))}
        active={view}
        onChange={onViewChange}
      />
      <span className="trend-summary__label">{label}</span>
      {view === "perMonth" ? (
        <>
          <span className="trend-summary__amount trend-summary__amount--neutral">
            {formatSavings(trend.total)}
          </span>
          <span className="trend-summary__delta">
            <span className="trend-summary__caption">
              {plural("savingsTrend.total.months", trend.months)} {"·"}{" "}
              {t("savingsTrend.total.average", { amount: formatSavings(trend.average) })}
            </span>
          </span>
        </>
      ) : (
        <>
          <span className={`trend-summary__amount trend-summary__amount--${AMOUNT_TONES[tone]}`}>
            {formatSignedSavings(difference)}
          </span>
          <span className="trend-summary__delta">
            {(change.kind === "up" || change.kind === "down" || change.kind === "flat") && (
              <ChangePill kind={change.kind} tone={tone} percent={formatPercent(change.percent)} />
            )}
            {change.kind === "new" && (
              <span className="change-pill change-pill--flat">{t("categoryTrends.new")}</span>
            )}
            <span className="trend-summary__caption">
              {t("savingsTrend.compare", {
                end: formatSavings(end.amount),
                reference: formatSavings(reference.amount),
              })}
            </span>
          </span>
        </>
      )}
    </div>
  );
};

export default CategoryTrendSummary;
