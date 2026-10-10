import React, { useId, useState } from "react";
import { useTranslation } from "../../../../i18n";
import type { TrendPoint } from "../../../../helpers/savingsTrend/savingsTrend.types";
import {
  formatSavings,
  formatSignedSavings,
} from "../../../../helpers/savingsTrend/formatters";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import {
  CHART,
  getChartGeometry,
  getNearestIndex,
  getTickIndexes,
} from "./chartGeometry";
import ChartTooltip from "./ChartTooltip";
import "./styles.scss";

interface TrendChartProps {
  /** Every month from the reference month to the end month. */
  points: TrendPoint[];
}

const MAX_TICKS = 7;
// A tick that carries a year ("Oct ’25") is wider.
const MAX_TICKS_WITH_YEAR = 5;

/**
 * The monthly savings as a line over a dashed baseline at the reference
 * month's savings: green where the line is above it, red (and hatched) where
 * it is below. Tap, hover or use the arrow keys to read a month.
 */
const TrendChart = ({ points }: TrendChartProps) => {
  const { t, language } = useTranslation();
  const id = useId().replace(/:/g, "");
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? selected;

  const values = points.map((point) => point.savings);
  const { xs, ys, baselineY } = getChartGeometry(values);
  const last = points.length - 1;
  const crossesYears = points[0].year !== points[last].year;
  const monthName = (point: TrendPoint, style: "title" | "sentence") =>
    `${getMonthLabel(point.month, language, style)}${crossesYears ? ` ${point.year}` : ""}`;
  const monthWithYear = (point: TrendPoint, style: "title" | "sentence") =>
    `${getMonthLabel(point.month, language, style)} ${point.year}`;
  const tickLabel = (point: TrendPoint) =>
    `${getMonthLabel(point.month, language, "short")}${
      crossesYears ? ` ’${String(point.year).slice(-2)}` : ""
    }`;
  const referenceName = monthName(points[0], "sentence");

  const polyline = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = `${xs[0].toFixed(1)},${baselineY.toFixed(1)} ${polyline} ${xs[last].toFixed(1)},${baselineY.toFixed(1)}`;
  const lineProps = { points: polyline, strokeWidth: 2 };
  const isUp = (value: number) => value >= values[0];
  const referenceLabelY =
    ys[0] > CHART.paddingTop + 14 ? ys[0] - 10 : ys[0] + 18;

  const indexAt = (event: React.MouseEvent<HTMLElement>) => {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    const ratio = width ? (event.clientX - left) / width : 0.5;
    return getNearestIndex(ratio * CHART.width, xs);
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape" && selected !== null) {
      event.preventDefault();
      setSelected(null);
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setSelected((current) =>
        current === null
          ? step > 0 ? 0 : last
          : Math.min(last, Math.max(0, current + step))
      );
    }
  };

  const point = active === null ? null : points[active];
  const difference = point ? point.savings - values[0] : 0;

  const chartLabel = t("savingsTrend.chartLabel", {
    from: monthWithYear(points[0], "sentence"),
    to: monthWithYear(points[last], "sentence"),
    value: formatSavings(values[last]),
  });

  return (
    <>
      <div className="savings-trend-chart">
        <div
          className="savings-trend-chart__area"
          role="group"
          aria-label={chartLabel}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onClick={(event) => {
            const index = indexAt(event);
            setSelected((current) => (current === index ? null : index));
          }}
          onPointerMove={(event) =>
            event.pointerType === "mouse" && setHovered(indexAt(event))
          }
          onPointerLeave={() => setHovered(null)}
        >
          {point && active !== null && (
            <ChartTooltip
              title={monthWithYear(point, "title")}
              amount={formatSavings(point.savings)}
              share={(xs[active] / CHART.width) * 100}
              anchor={active < points.length / 2 ? "left" : "right"}
              comparison={
                active === 0
                  ? undefined
                  : {
                      text: t("savingsTrend.tooltipVs", {
                        difference: formatSignedSavings(difference),
                        month: getMonthLabel(points[0].month, language, "short"),
                      }),
                      tone: isUp(point.savings) ? "up" : "down",
                    }
              }
            />
          )}
          <svg
            className="savings-trend-chart__svg"
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            aria-hidden="true"
          >
            <defs>
              <clipPath id={`${id}-above`}>
                <rect x="0" y="0" width={CHART.width} height={baselineY} />
              </clipPath>
              <clipPath id={`${id}-below`}>
                <rect x="0" y={baselineY} width={CHART.width} height={CHART.height - baselineY} />
              </clipPath>
              <pattern
                id={`${id}-hatch`}
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line className="savings-trend-chart__hatch" x1="0" y1="0" x2="0" y2="5" />
              </pattern>
            </defs>
            <line
              className="savings-trend-chart__baseline"
              x1={CHART.paddingLeft}
              y1={baselineY}
              x2={CHART.width - CHART.paddingRight}
              y2={baselineY}
            />
            <polygon className="savings-trend-chart__area-above" points={area} clipPath={`url(#${id}-above)`} />
            <polygon className="savings-trend-chart__area-below" points={area} clipPath={`url(#${id}-below)`} />
            <polygon fill={`url(#${id}-hatch)`} points={area} clipPath={`url(#${id}-below)`} />
            <polyline className="savings-trend-chart__line-above" {...lineProps} clipPath={`url(#${id}-above)`} />
            <polyline className="savings-trend-chart__line-below" {...lineProps} clipPath={`url(#${id}-below)`} />
            {getTickIndexes(points.length, crossesYears ? MAX_TICKS_WITH_YEAR : MAX_TICKS).map((i) => (
              <text
                key={i}
                className="savings-trend-chart__tick"
                x={xs[i]}
                y={CHART.height - 4}
                textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
              >
                {tickLabel(points[i])}
              </text>
            ))}
            {active !== null && (
              <line
                className="savings-trend-chart__guide"
                x1={xs[active]}
                y1={CHART.paddingTop - 6}
                x2={xs[active]}
                y2={CHART.height - CHART.paddingBottom}
              />
            )}
            <circle className="savings-trend-chart__dot-reference" cx={xs[0]} cy={ys[0]} r="4.5" />
            {active !== null && active !== 0 && active !== last && (
              <circle
                className={`savings-trend-chart__dot savings-trend-chart__dot--${isUp(values[active]) ? "up" : "down"}`}
                cx={xs[active]}
                cy={ys[active]}
                r="5"
              />
            )}
            <circle
              className={`savings-trend-chart__dot savings-trend-chart__dot--${isUp(values[last]) ? "up" : "down"}`}
              cx={xs[last]}
              cy={ys[last]}
              r="5"
            />
            {active === null && (
              <text className="savings-trend-chart__end-label" x={xs[last]} y={ys[last] - 10} textAnchor="end">
                {formatSavings(values[last])}
              </text>
            )}
            <text className="savings-trend-chart__reference-label" x={xs[0]} y={referenceLabelY}>
              {monthName(points[0], "title")} {formatSavings(values[0])}
            </text>
          </svg>
          <table className="visually-hidden">
            <caption>{t("savingsTrend.table.caption")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("savingsTrend.table.month")}</th>
                <th scope="col">{t("savingsTrend.table.savings")}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={`${point.year}-${point.month}`}>
                  <th scope="row">{monthWithYear(point, "title")}</th>
                  <td>{formatSavings(point.savings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="savings-trend-chart__key">
          <span>
            <span className="savings-trend-chart__swatch savings-trend-chart__swatch--reference" />
            {t("savingsTrend.key.reference", { reference: referenceName })}
          </span>
          <span>
            <span className="savings-trend-chart__swatch savings-trend-chart__swatch--above" />
            {t("savingsTrend.key.above")}
          </span>
          <span>
            <span className="savings-trend-chart__swatch savings-trend-chart__swatch--below" />
            {t("savingsTrend.key.below")}
          </span>
        </div>
      </div>
      <p className="savings-trend-chart__note">
        {t("savingsTrend.note", { reference: referenceName })}
      </p>
    </>
  );
};

export default TrendChart;
