// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "../../i18n";

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
}: WizardProgressProps) => {
  const { t } = useTranslation();
  return (
    <div className="wizard-progress">
      <div className="wizard-progress__bar-row">
        <progress value={reviewedCount} max={total} />
        <span aria-live="polite" className="wizard-progress__count">
          {t("syncReview.progress", {
            current: Math.min(reviewedCount + 1, total),
            total,
          })}
        </span>
      </div>
      <div className="wizard-progress__bulk">
        <Button variant="secondary" onClick={onAcceptAll}>
          {t("syncReview.acceptAll")}
        </Button>
        <Button variant="secondary" onClick={onRejectAll}>
          {t("syncReview.rejectAll")}
        </Button>
      </div>
    </div>
  );
};

export default WizardProgress;
