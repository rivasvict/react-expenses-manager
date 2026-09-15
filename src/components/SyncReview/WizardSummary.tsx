import React from "react";
import { Button } from "react-bootstrap";
import { FormButton } from "../common/Forms";

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
  const isUploading = uploadState === "uploading";
  return (
    <div className="wizard-summary">
      <h2 className="wizard-summary__title">Review complete</h2>
      <p className="wizard-summary__counts">
        {acceptedCount} accepted · {modifiedCount} modified · {rejectedCount}{" "}
        rejected
      </p>
      {isUploading && <p role="status">Saving your changes…</p>}
      {uploadState === "network-failed" && (
        <p
          role="alert"
          className="restore-backup-error text-danger vertical-standard-space"
        >
          Couldn't save your changes to your party. Check your connection and
          try again.
        </p>
      )}
      {uploadState === "conflict" && (
        <p
          role="alert"
          className="restore-backup-error text-danger vertical-standard-space"
        >
          Your party synced new changes while you were reviewing. Sync again
          to pick them up — you'll review everything fresh, including what
          you just saw.
        </p>
      )}
      {uploadState === "conflict" ? (
        <FormButton variant="primary" onClick={onSyncAgain}>
          Sync again
        </FormButton>
      ) : (
        <FormButton
          variant="primary"
          disabled={isUploading}
          onClick={onUpload}
        >
          {isUploading
            ? "Saving…"
            : uploadState === "network-failed"
              ? "Retry"
              : "Upload & finish"}
        </FormButton>
      )}
      <Button
        variant="secondary"
        className="full-width vertical-standard-space"
        disabled={isUploading}
        onClick={onCancelReview}
      >
        Cancel review
      </Button>
    </div>
  );
};

export default WizardSummary;
