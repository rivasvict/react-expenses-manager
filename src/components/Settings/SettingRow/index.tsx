import React, { forwardRef } from "react";
import { Icon } from "@iconify/react";
import chevronRightIcon from "@iconify-icons/codicon/chevron-right";
import "./styles.scss";

interface SettingRowProps {
  label: string;
  hint: string;
  value: string;
  onOpen: () => void;
}

/**
 * One setting on the Settings screen: its name, a short hint and the current
 * value. Tapping it opens the sheet where the value is picked, so it is a
 * button that announces a dialog.
 */
const SettingRow = forwardRef<HTMLButtonElement, SettingRowProps>(
  ({ label, hint, value, onOpen }, ref) => (
    <button
      type="button"
      className="setting-row"
      aria-haspopup="dialog"
      ref={ref}
      onClick={onOpen}
    >
      <span className="setting-row__text">
        <span className="setting-row__label">{label}</span>
        <span className="setting-row__hint">{hint}</span>
      </span>
      <span className="setting-row__value">
        {value}
        <Icon icon={chevronRightIcon} aria-hidden="true" />
      </span>
    </button>
  ),
);

export default SettingRow;
