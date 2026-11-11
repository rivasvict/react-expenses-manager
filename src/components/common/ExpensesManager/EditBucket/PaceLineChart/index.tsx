import React from "react";
import {
  getCumulativeSpending,
  getDaysInMonth,
  getElapsedDays,
  PaceExpense,
  SelectedMonth,
} from "../../../../../helpers/bucketPace/bucketPace";
import { formatNumberForDisplay } from "../../../../../helpers/entriesHelper/entriesHelper";
import { formatDayMonth } from "../../../../../helpers/shortDate/shortDate";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

interface PaceLineChartProps {
  expenses: PaceExpense[];
  availability: number;
  selectedDate: SelectedMonth;
  today: Date;
}

const LEFT = 8;
const WIDTH = 304;
const BOTTOM = 120;
const HEIGHT = 108;

/**
 * The "Month line" view (design/features/bucket-expenses/ui/decision.md): the
 * running total of spending through the month against a dashed straight line
 * of even pace up to what is available, with today marked. Green while at or
 * under the pace, amber above it. Drawn only when a pace applies.
 */
const PaceLineChart = ({ expenses, availability, selectedDate, today }: PaceLineChartProps) => {
  const { t, language } = useTranslation();
  const elapsed = getElapsedDays({ selectedDate, today });
  if (availability <= 0 || elapsed === 0) return null;

  const daysInMonth = getDaysInMonth(selectedDate);
  const points = getCumulativeSpending(expenses);
  const spent = points.length ? points[points.length - 1].total : 0;
  const top = Math.max(availability, spent);
  const x = (day: number) => LEFT + (day / daysInMonth) * WIDTH;
  const y = (value: number) => BOTTOM - (value / top) * HEIGHT;
  const markerDay = Math.max(elapsed, points.length ? points[points.length - 1].day : 0);
  const tone = spent <= (availability * elapsed) / daysInMonth ? "ok" : "ahead";
  const day = (dayOfMonth: number) =>
    formatDayMonth(new Date(selectedDate.year, selectedDate.month, dayOfMonth, 12).getTime(), language);

  let path = `M${x(0).toFixed(1)} ${y(0).toFixed(1)}`;
  points.forEach(({ day: pointDay, total }) => {
    path += ` H${x(pointDay).toFixed(1)} V${y(total).toFixed(1)}`;
  });
  path += ` H${x(markerDay).toFixed(1)}`;

  return (
    <div className="pace-line" data-testid="pace-line">
      <h3 className="pace-line__title">{t("editBucket.chartLineTitle")}</h3>
      <svg viewBox="0 0 320 142" role="img" aria-label={t("editBucket.chartLineLabel")}>
        <line className="pace-line__rule" x1={LEFT} x2={LEFT + WIDTH} y1={y(availability)} y2={y(availability)} />
        <text className="pace-line__text" x={LEFT} y={y(availability) - 4}>
          {t("editBucket.chartAvailable", { amount: formatNumberForDisplay(availability) })}
        </text>
        <line className="pace-line__rule" x1={LEFT} x2={LEFT + WIDTH} y1={BOTTOM} y2={BOTTOM} />
        <path className={`pace-line__area ${tone}`} d={`${path} V${y(0).toFixed(1)} Z`} />
        <line className="pace-line__even" x1={x(0)} y1={y(0)} x2={x(daysInMonth)} y2={y(availability)} />
        <path className={`pace-line__spent ${tone}`} d={path} />
        <line className="pace-line__today" x1={x(markerDay)} x2={x(markerDay)} y1={12} y2={BOTTOM} />
        <circle className={`pace-line__dot ${tone}`} cx={x(markerDay)} cy={y(spent)} r={4} />
        <text className="pace-line__text" x={LEFT} y={134}>{day(1)}</text>
        <text className="pace-line__text" x={LEFT + WIDTH / 2} y={134} textAnchor="middle">{day(15)}</text>
        <text className="pace-line__text" x={LEFT + WIDTH} y={134} textAnchor="end">{day(daysInMonth)}</text>
      </svg>
      <div className="pace-line__legend">
        <span><i className={`pace-line__swatch ${tone}`} />{t("editBucket.chartSpentSoFar")}</span>
        <span><i className="pace-line__swatch pace-line__swatch--even" />{t("editBucket.chartEvenPace", { amount: formatNumberForDisplay(availability) })}</span>
      </div>
      <p className="pace-line__hint">{t("editBucket.lineHint")}</p>
    </div>
  );
};

export default PaceLineChart;
