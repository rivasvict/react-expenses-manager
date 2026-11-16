import React from "react";
import { BucketExpense, BucketWeek } from "../../../../../helpers/bucketPace/bucketPace";
import { getCurrencySymbol } from "../../../../../helpers/currency/currency";
import { formatNumberForDisplay } from "../../../../../helpers/entriesHelper/entriesHelper";
import { formatDayMonth } from "../../../../../helpers/shortDate/shortDate";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

interface WeekBarsChartProps {
  /** Every week so far, oldest first, quiet weeks included. */
  weeks: BucketWeek<BucketExpense>[];
  year: number;
  /** 0-indexed month, as in `selectedDate`. */
  month: number;
  /** What is available this month; the hint quotes it when there is a pace. */
  availability: number;
}

/**
 * The "Weekly bars" view (design/features/bucket-expenses/ui/decision.md): a
 * column for each week with its amount and dates and a dashed line at what an
 * even pace allows for that week. Green within the pace, amber above it.
 */
const WeekBarsChart = ({ weeks, year, month, availability }: WeekBarsChartProps) => {
  const { t, language } = useTranslation();
  const symbol = getCurrencySymbol();
  const hasPace = weeks.some(({ pace }) => pace !== null);
  const scale = Math.max(...weeks.map(({ spent, pace }) => Math.max(spent, pace ?? 0))) * 1.1 || 1;
  const monthName = new Intl.DateTimeFormat(language, { month: "short" }).format(
    new Date(year, month, 1)
  );
  const labelOf = ({ startDay, endDay }: BucketWeek<BucketExpense>) =>
    startDay === endDay
      ? formatDayMonth(new Date(year, month, startDay, 12).getTime(), language)
      : t("editBucket.weekRangeShort", { month: monthName, start: startDay, end: endDay });

  return (
    <div className="week-bars" data-testid="week-bars">
      <div className="week-bars__head">
        <h3 className="week-bars__title">{t("editBucket.chartWeeklyTitle", { currency: symbol })}</h3>
        {hasPace && (
          <span className="week-bars__legend">
            <i aria-hidden="true" />
            {t("editBucket.weeklyPace")}
          </span>
        )}
      </div>
      <div className="week-bars__cols" role="img" aria-label={t("editBucket.chartWeeklyLabel")}>
        {weeks.map((week) => (
          <div className="week-bars__col" key={week.startDay}>
            <div className="week-bars__plot">
              {week.spent > 0 && (
                <i
                  className={`week-bars__bar${week.pace !== null && week.spent > week.pace ? " ahead" : ""}`}
                  style={{ height: `${(week.spent / scale) * 100}%` }}
                />
              )}
              {week.pace !== null && (
                <span className="week-bars__pace" style={{ bottom: `${(week.pace / scale) * 100}%` }} />
              )}
            </div>
            <b>{week.spent > 0 ? formatNumberForDisplay(week.spent).replace(symbol, "") : "0"}</b>
            <small>{labelOf(week)}</small>
          </div>
        ))}
      </div>
      {hasPace && (
        <p className="week-bars__hint">
          {t("editBucket.barsHint", { amount: formatNumberForDisplay(availability) })}
        </p>
      )}
    </div>
  );
};

export default WeekBarsChart;
