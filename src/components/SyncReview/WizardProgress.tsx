import React from "react";
import { Button } from "react-bootstrap";

interface WizardProgressProps {
  reviewedCount: number;
  total: number;
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

/**
 * Progress bar + count (DESIGN 4.3.1) and the Accept all / Reject all
 * shortcuts for the remaining unreviewed items (DESIGN 4.3.3, AC-3.5).
 * Only the count text lives in the aria-live region, so screen readers
 * hear "Item 3 of 12" — not the whole card — on every advance.
 */
const WizardProgress = ({
  reviewedCount,
  total,
  onAcceptAll,
  onRejectAll,
}: WizardProgressProps) => (
  <div className="wizard-progress">
    <div className="wizard-progress__bar-row">
      <progress value={reviewedCount} max={total} />
      <span aria-live="polite" className="wizard-progress__count">
        Item {Math.min(reviewedCount + 1, total)} of {total}
      </span>
    </div>
    <div className="wizard-progress__bulk">
      <Button variant="secondary" onClick={onAcceptAll}>
        Accept all
      </Button>
      <Button variant="secondary" onClick={onRejectAll}>
        Reject all
      </Button>
    </div>
  </div>
);

export default WizardProgress;
