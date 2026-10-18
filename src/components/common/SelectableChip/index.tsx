import React from "react";
import "./styles.scss";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

/**
 * A pill that toggles on and off (a category the user keeps or drops). The
 * selected one gets the gold-soft wash and a check; the label is shown exactly
 * as given, whatever its length, and wraps rather than truncating.
 */
const SelectableChip = ({ label, selected, onToggle }: SelectableChipProps) => (
  <button
    type="button"
    aria-pressed={selected}
    className={`selectable-chip${selected ? " selectable-chip--selected" : ""}`}
    onClick={onToggle}
  >
    {selected && (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="selectable-chip__check">
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
    )}
    {label}
  </button>
);

export default SelectableChip;
