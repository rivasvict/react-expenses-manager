import React, { useId } from "react";
import { useTranslation } from "../../../../i18n";
import type { CategoryTrend } from "../../../../helpers/categoryTrends/categoryTrends.types";
import type { MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import { formatSavings } from "../../../../helpers/savingsTrend/formatters";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import {
  CHART,
  getChartGeometry,
  getTickIndexes,
} from "../../SavingsTrend/TrendChart/chartGeometry";
import ChartKey from "./ChartKey";
import "./styles.scss";

export type CategoryTrendView = "perMonth" | "change";

interface CategoryTrendChartProps {
  trend: CategoryTrend;
  view: CategoryTrendView;
}

const MAX_TICKS = 7;
// A tick that carries a year ("Oct ’25") is wider.
const MAX_TICKS_WITH_YEAR = 5;

/**
 * A category's monthly amounts as a line. `perMonth` draws it in gold over a
 * zero line; `change` draws it against a dashed line at the reference month,
 * green where the month was better news (less spent, more earned) and red,
 * hatched, where it was worse.
 */
const CategoryTrendChart = ({ trend, view }: CategoryTrendChartProps) => {
  const { t, language } = useTranslation();
  const id = useId().replace(/:/g, "");
  const { points, type, name } = trend;
  const isChange = view === "change";
  const values = points.map((point) => point.amount);
  const baseline = isChange ? values[0] : 0;
  const { xs, ys, baselineY } = getChartGeometry(values, baseline);
  const last = points.length - 1;
  const crossesYears = points[0].year !== points[last].year;
  const tickLabel = (point: MonthDate) =>
    `${getMonthLabel(point.month, language, "short")}${
      crossesYears ? ` ’${String(point.year).slice(-2)}` : ""
    }`;
  const monthWithYear = (point: MonthDate, style: "title" | "sentence") =>
    `${getMonthLabel(point.month, language, style)} ${point.year}`;
  const referenceName = `${getMonthLabel(points[0].month, language, "sentence")}${
    crossesYears ? ` ${points[0].year}` : ""
  }`;

  const polyline = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${xs[0].toFixed(1)},${baselineY.toFixed(1)} ${polyline} ${xs[last].toFixed(1)},${baselineY.toFixed(1)}`;
  // Above the baseline is more: bad news for an expense, good for an income.
  const above = type === "income" ? "good" : "bad";
  const below = type === "income" ? "bad" : "good";
  const toneOf = (value: number) =>
    value === baseline ? "flat" : value > baseline ? above : below;
  const chartLabel = t(`categoryTrends.chartLabel.${view}`, {
    category: name,
    reference: referenceName,
    from: monthWithYear(points[0], "sentence"),
    to: monthWithYear(points[last], "sentence"),
  });
  const clip = (side: "above" | "below") => `url(#${id}-${side})`;

  return (
    <>
      <div className={`category-trend-chart category-trend-chart--${view}`}>
        <div role="img" aria-label={chartLabel}>
          <svg className="category-trend-chart__svg" viewBox={`0 0 ${CHART.width} ${CHART.height}`} aria-hidden="true">
            <defs>
              <clipPath id={`${id}-above`}>
                <rect x="0" y="0" width={CHART.width} height={baselineY} />
              </clipPath>
              <clipPath id={`${id}-below`}>
                <rect x="0" y={baselineY} width={CHART.width} height={CHART.height - baselineY} />
              </clipPath>
              <pattern id={`${id}-hatch`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line className="category-trend-chart__hatch" x1="0" y1="0" x2="0" y2="5" />
              </pattern>
            </defs>
            <line
              className="category-trend-chart__baseline"
              x1={CHART.paddingLeft}
              y1={baselineY}
              x2={CHART.width - CHART.paddingRight}
              y2={baselineY}
            />
            {isChange ? (
              <>
                <polygon className={`category-trend-chart__area--${above}`} points={area} clipPath={clip("above")} />
                <polygon className={`category-trend-chart__area--${below}`} points={area} clipPath={clip("below")} />
                <polygon fill={`url(#${id}-hatch)`} points={area} clipPath={clip(above === "bad" ? "above" : "below")} />
                <polyline className={`category-trend-chart__line--${above}`} points={polyline} clipPath={clip("above")} />
                <polyline className={`category-trend-chart__line--${below}`} points={polyline} clipPath={clip("below")} />
              </>
            ) : (
              <>
                <polygon className="category-trend-chart__area--month" points={area} />
                <polyline className="category-trend-chart__line--month" points={polyline} />
              </>
            )}
            {getTickIndexes(points.length, crossesYears ? MAX_TICKS_WITH_YEAR : MAX_TICKS).map((i) => (
              <text
                key={i}
                className={`category-trend-chart__tick${i === 0 ? " category-trend-chart__tick--reference" : ""}`}
                x={xs[i]}
                y={CHART.height - 4}
                textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
              >
                {tickLabel(points[i])}
              </text>
            ))}
            <circle className="category-trend-chart__dot-reference" cx={xs[0]} cy={ys[0]} r="4.5" />
            <circle
              className={`category-trend-chart__dot category-trend-chart__dot--${isChange ? toneOf(values[last]) : "month"}`}
              cx={xs[last]}
              cy={ys[last]}
              r="5"
            />
            <text className="category-trend-chart__end-label" x={xs[last]} y={ys[last] - 10} textAnchor="end">
              {formatSavings(values[last])}
            </text>
          </svg>
        </div>
        <table className="visually-hidden">
          <caption>{t("categoryTrends.table.caption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("categoryTrends.table.month")}</th>
              <th scope="col">{t("categoryTrends.table.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((row) => (
              <tr key={`${row.year}-${row.month}`}>
                <th scope="row">{monthWithYear(row, "title")}</th>
                <td>{formatSavings(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ChartKey view={view} type={type} reference={referenceName} />
      </div>
      <p className="category-trend-chart__note">
        {t(`categoryTrends.note.${view}.${type}`, { reference: referenceName })}
      </p>
    </>
  );
};

export default CategoryTrendChart;
