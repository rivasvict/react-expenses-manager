import React from "react";
import "./styles.scss";

interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: string;
}

interface SegmentedControlProps<Value extends string> {
  /** The group's accessible name ("Language"). */
  label: string;
  name: string;
  options: SegmentedControlOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

/**
 * A few mutually exclusive choices side by side, the chosen one raised in the
 * gold-soft wash. Built on native radios, so arrow keys and screen readers
 * work without extra code.
 */
const SegmentedControl = <Value extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) => (
  <div role="radiogroup" aria-label={label} className="segmented-control">
    {options.map((option) => (
      <label
        key={option.value}
        className={`segmented-control__option${
          option.value === value ? " segmented-control__option--selected" : ""
        }`}
      >
        <input
          type="radio"
          name={name}
          className="segmented-control__input"
          value={option.value}
          checked={option.value === value}
          onChange={() => onChange(option.value)}
        />
        {option.label}
      </label>
    ))}
  </div>
);

export default SegmentedControl;
