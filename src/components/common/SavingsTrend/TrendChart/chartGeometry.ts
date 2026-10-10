// The geometry of the Savings trend chart, in SVG user units
// (design/features/savings-trend/ui/decision.md, "Chart").

export const CHART = {
  width: 300,
  height: 150,
  paddingLeft: 8,
  paddingRight: 8,
  paddingTop: 18,
  paddingBottom: 22,
};

// Room above and below the data, as a share of its span.
const VERTICAL_MARGIN = 0.12;

export interface ChartGeometry {
  xs: number[];
  ys: number[];
  /** Where the reference month's savings sit: the dashed baseline. */
  baselineY: number;
}

/**
 * Evenly spaced points; the vertical scale covers the points and the baseline
 * (the first value) so the baseline is always on the chart.
 */
export const getChartGeometry = (values: number[]): ChartGeometry => {
  const baseline = values[0];
  const low = Math.min(...values, baseline);
  const high = Math.max(...values, baseline);
  const span = high - low || 1;
  const min = low - span * VERTICAL_MARGIN;
  const max = high + span * VERTICAL_MARGIN;
  const innerWidth = CHART.width - CHART.paddingLeft - CHART.paddingRight;
  const innerHeight = CHART.height - CHART.paddingTop - CHART.paddingBottom;
  const toY = (value: number) =>
    CHART.paddingTop + (innerHeight * (max - value)) / (max - min);
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;
  return {
    xs: values.map((_, index) => CHART.paddingLeft + step * index),
    ys: values.map(toY),
    baselineY: toY(baseline),
  };
};

/** Which of `count` points get an axis label: evenly spread, first and last included. */
export const getTickIndexes = (count: number, maxLabels: number): number[] => {
  const labels = Math.min(count, maxLabels);
  if (labels < 2) return [0];
  const indexes = Array.from({ length: labels }, (_, k) =>
    Math.round((k * (count - 1)) / (labels - 1))
  );
  return Array.from(new Set(indexes));
};

/** The point closest to an x position given in chart user units. */
export const getNearestIndex = (x: number, xs: number[]): number =>
  xs.reduce(
    (nearest, pointX, index) =>
      Math.abs(pointX - x) < Math.abs(xs[nearest] - x) ? index : nearest,
    0
  );
