import React from "react";
import "./styles.scss";

export interface UsageFigure {
  value: string;
  label: string;
}

/**
 * Usage figures (design/system/components.md): a three-column strip of a
 * bold value over a small label, e.g. "5 expenses · $275.95 in total ·
 * $400.00 bucket / mo".
 */
const UsageFigures = ({ figures }: { figures: UsageFigure[] }) => (
  <dl className="usage-figures">
    {figures.map(({ value, label }) => (
      <div className="usage-figures__item" key={label}>
        <dt className="usage-figures__label">{label}</dt>
        <dd className="usage-figures__value">{value}</dd>
      </div>
    ))}
  </dl>
);

export default UsageFigures;
