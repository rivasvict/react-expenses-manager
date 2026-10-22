import React from "react";
import type { CategoryTone } from "../../../../helpers/categoryTrends/categoryTrends.types";
import "./styles.scss";

const WIDTH = 60;
const HEIGHT = 26;
const PADDING = 2;

interface SparklineProps {
  values: number[];
  tone: CategoryTone;
}

/**
 * A small decorative line of a category's months, coloured by whether the
 * change is good or bad news. A flat series draws a flat line across the middle.
 */
const Sparkline = ({ values, tone }: SparklineProps) => {
  const low = Math.min(...values);
  const span = Math.max(...values) - low;
  const step = values.length > 1 ? (WIDTH - PADDING * 2) / (values.length - 1) : 0;
  const points = values
    .map((value, index) => {
      const y = span ? HEIGHT - PADDING * 2 - ((HEIGHT - PADDING * 4) * (value - low)) / span : HEIGHT / 2;
      return `${(PADDING + step * index).toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className={`sparkline sparkline--${tone}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
};

export default Sparkline;
