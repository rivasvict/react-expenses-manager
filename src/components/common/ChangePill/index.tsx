import React from "react";
import "./styles.scss";

export type ChangeKind = "up" | "down" | "flat";

// The arrow and the sign carry the direction, so colour is never the only cue.
const SIGNS: Record<ChangeKind, string> = { up: "+", down: "−", flat: "" };

const ICON_PATHS: Record<ChangeKind, string> = {
  up: "M6 1.5 10.5 6.5H7.4V10.5H4.6V6.5H1.5Z",
  down: "M6 10.5 1.5 5.5H4.6V1.5H7.4V5.5H10.5Z",
  flat: "M2 5h8v2H2Z",
};

interface ChangePillProps {
  kind: ChangeKind;
  /** Already formatted, e.g. "12.5%" */
  percent: string;
  "aria-hidden"?: boolean;
}

/**
 * A tinted pill with an arrow and a signed percentage: green ▲ when savings
 * went up, red ▼ when they went down, a grey dash when nothing changed.
 */
const ChangePill = ({ kind, percent, "aria-hidden": ariaHidden }: ChangePillProps) => (
  <span className={`change-pill change-pill--${kind}`} aria-hidden={ariaHidden}>
    <svg className="change-pill__icon" viewBox="0 0 12 12" aria-hidden="true">
      <path d={ICON_PATHS[kind]} />
    </svg>
    {SIGNS[kind]}
    {percent}
  </span>
);

export default ChangePill;
