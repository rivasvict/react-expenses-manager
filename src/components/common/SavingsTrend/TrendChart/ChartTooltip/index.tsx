import React from "react";
import "./styles.scss";

interface ChartTooltipProps {
  /** The month, e.g. "July 2026". */
  title: string;
  /** That month's savings. */
  amount: string;
  /** How it compares with the reference month; absent for the reference month itself. */
  comparison?: { text: string; tone: "up" | "down" };
  /** Share of the plot's width the tooltip's point sits at, 0 to 100. */
  share: number;
  /** Which edge sits at the point: the tooltip opens away from it. */
  anchor: "left" | "right";
}

/**
 * The tooltip over the chart. The caller picks the side that keeps it inside
 * the card (open to the right of a point in the first half of the months, to
 * the left of one in the second). Taps pass through it to the plot underneath.
 */
const ChartTooltip = ({
  title,
  amount,
  comparison,
  share,
  anchor,
}: ChartTooltipProps) => {
  const position =
    anchor === "left"
      ? { left: `calc(${share.toFixed(1)}% - 0.2rem)` }
      : { right: `calc(${(100 - share).toFixed(1)}% - 0.2rem)` };
  return (
    <span
      className="chart-tooltip"
      data-testid="chart-tooltip"
      style={position}
      aria-hidden="true"
    >
      <strong>{title}</strong>
      {amount}
      {comparison && (
        <>
          <br />
          <span className={`chart-tooltip__comparison--${comparison.tone}`}>
            {comparison.text}
          </span>
        </>
      )}
    </span>
  );
};

export default ChartTooltip;
