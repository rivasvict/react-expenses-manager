// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import { Button } from "react-bootstrap";
import { FormButton } from "../common/Forms";
import { useTranslation } from "../../i18n";

export type UploadState = "idle" | "uploading" | "network-failed" | "conflict";

interface WizardSummaryProps {
  acceptedCount: number;
  modifiedCount: number;
  rejectedCount: number;
  uploadState: UploadState;
  onUpload: () => void;
  onSyncAgain: () => void;
  onCancelReview: () => void;
}

/**
 * Review summary → upload (DESIGN 4.3.4, AC-3.8). Upload outcomes:
 * network failure keeps the staged set with a Retry; a version conflict
 * (EC-2) discards it — "Sync again" re-runs the whole sync fresh, because
 * replaying stale decisions could silently accept outdated values.
 */
const WizardSummary = ({
  acceptedCount,
  modifiedCount,
  rejectedCount,
  uploadState,
  onUpload,
  onSyncAgain,
  onCancelReview,
}: WizardSummaryProps) => {
  const { t } = useTranslation();
  const isUploading = uploadState === "uploading";
  return (
    <div className="wizard-summary">
      <h2 className="wizard-summary__title">{t("syncReview.complete")}</h2>
      <p className="wizard-summary__counts">
        {t("syncReview.counts", {
          accepted: acceptedCount,
          modified: modifiedCount,
          rejected: rejectedCount,
        })}
      </p>
      {isUploading && <p role="status">{t("syncReview.saving")}</p>}
      {uploadState === "network-failed" && (
        <p
          role="alert"
          className="restore-backup-error text-danger vertical-standard-space"
        >
          {t("syncReview.uploadFailed")}
        </p>
      )}
      {uploadState === "conflict" && (
        <p
          role="alert"
          className="restore-backup-error text-danger vertical-standard-space"
        >
          {t("syncReview.uploadConflict")}
        </p>
      )}
      {uploadState === "conflict" ? (
        <FormButton variant="primary" onClick={onSyncAgain}>
          {t("syncReview.syncAgain")}
        </FormButton>
      ) : (
        <FormButton
          variant="primary"
          disabled={isUploading}
          onClick={onUpload}
        >
          {isUploading
            ? t("syncReview.savingShort")
            : uploadState === "network-failed"
              ? t("syncReview.retry")
              : t("syncReview.uploadAndFinish")}
        </FormButton>
      )}
      <Button
        variant="secondary"
        className="full-width vertical-standard-space"
        disabled={isUploading}
        onClick={onCancelReview}
      >
        {t("syncReview.cancelReview")}
      </Button>
    </div>
  );
};

export default WizardSummary;
