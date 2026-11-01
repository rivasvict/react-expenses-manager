import React from "react";
import "./styles.scss";

interface SwitchRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Extra class, e.g. to place the row inside a sheet. */
  className?: string;
}

/**
 * A setting that is simply on or off, in the same raised row as `SettingRow`:
 * its name and a short hint on the left, the switch on the right. The whole
 * row is the switch, so it is one large tap target.
 */
const SwitchRow = ({
  label,
  hint,
  checked,
  onChange,
  className = "",
}: SwitchRowProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`switch-row ${className}`.trim()}
    onClick={() => onChange(!checked)}
  >
    <span className="switch-row__text">
      <span className="switch-row__label">{label}</span>
      <span className="switch-row__hint">{hint}</span>
    </span>
    <span
      className={`switch-row__switch${
        checked ? " switch-row__switch--on" : ""
      }`}
      aria-hidden="true"
    />
  </button>
);

export default SwitchRow;
