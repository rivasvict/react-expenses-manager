import React from "react";
import "./styles.scss";

interface BucketRowProps {
  name: string;
  ticked: boolean;
  limit: string;
  error?: string;
  limitLabel: string;
  limitPlaceholder: string;
  onToggle: () => void;
  onLimitChange: (limit: string) => void;
}

/**
 * A category the user may give a monthly limit: a checkbox with the name, and
 * the limit field. Typing a limit ticks the row; an error from the wizard sits
 * under the row it belongs to.
 */
const BucketRow = ({
  name,
  ticked,
  limit,
  error,
  limitLabel,
  limitPlaceholder,
  onToggle,
  onLimitChange,
}: BucketRowProps) => (
  <div>
    <div className={`bucket-row${ticked ? "" : " bucket-row--off"}`}>
      <label className="bucket-row__main">
        <input
          type="checkbox"
          className="bucket-row__check"
          checked={ticked}
          onChange={onToggle}
        />
        <span className="bucket-row__name">{name}</span>
      </label>
      <input
        type="text"
        inputMode="decimal"
        name={`limit-${name}`}
        className={`form-control text bucket-row__limit${
          error ? " bucket-row__limit--invalid" : ""
        }`}
        value={limit}
        placeholder={limitPlaceholder}
        aria-label={limitLabel}
        aria-invalid={Boolean(error)}
        onChange={(event) => onLimitChange(event.target.value)}
      />
    </div>
    {error && (
      <p className="validation-message bucket-row__error" role="alert">
        {error}
      </p>
    )}
  </div>
);

export default BucketRow;
