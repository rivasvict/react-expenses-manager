import React, { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { MainContentContainer } from "../common/MainContentContainer";
import ButtonLikeLink from "../common/ButtonLikeLink";
import { FormButton } from "../common/Forms";
import ReviewItemCard from "./ReviewItemCard";
import WizardProgress from "./WizardProgress";
import WizardSummary, { UploadState } from "./WizardSummary";
import {
  clearPendingReview,
  completeReview,
  syncWithParty,
  SyncOutcome,
} from "../../redux/syncManager/syncThunk";
import { refreshMe } from "../../redux/syncManager/actionCreators";
import { SYNC_CARD_NOTICE_SET } from "../../redux/syncManager/actions";
import { PendingReview, SyncCardNotice } from "../../redux/syncManager/reducer";
import { IncomingItem } from "../../helpers/syncMergeHelper/syncMergeHelper";
import {
  SYNC_ERROR_CODES,
  isSyncApiError,
} from "../../services/syncApi/contract";
import "./styles.scss";

interface Decision {
  action: "accept" | "reject";
  // For accepted items this may carry modified values (EC-5); for
  // rejections it stays the original, whose hash feeds the memory.
  item: IncomingItem;
  modified: boolean;
}

interface SyncReviewProps {
  pendingReview: PendingReview | null;
  buckets: any;
  unbudgetedCategories: string[];
  onCompleteReview: (payload: {
    acceptedItems: IncomingItem[];
    rejectedItems: { key: string; hash: string }[];
    baseVersion: string;
  }) => Promise<void>;
  onSyncAgain: () => Promise<SyncOutcome>;
  onClearPendingReview: () => void;
  onRefreshMe: () => void;
  onSetCardNotice: (cardNotice: SyncCardNotice) => void;
}

/**
 * The review wizard (DESIGN §4.3): one incoming item at a time, decisions
 * staged in this component's state ONLY — nothing touches localStorage
 * until the final upload succeeds, which makes mid-wizard cancel,
 * navigation away and failed uploads all the same safe no-op (AC-3.11).
 * It consumes the diffed items + baseVersion of the exact download the
 * sync performed; it never re-downloads.
 */
const SyncReview = ({
  pendingReview,
  buckets,
  unbudgetedCategories,
  onCompleteReview,
  onSyncAgain,
  onClearPendingReview,
  onRefreshMe,
  onSetCardNotice,
}: SyncReviewProps) => {
  const history = useHistory();
  const [decisions, setDecisions] = useState<{ [key: string]: Decision }>({});
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [isDone, setIsDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const items = pendingReview ? pendingReview.items : [];
  const remaining = items.filter((item) => !decisions[item.key]);
  const currentItem = remaining[0];
  const reviewedCount = items.length - remaining.length;
  const onSummary = items.length > 0 && remaining.length === 0;

  // Focus management (DESIGN §5): the first mount focuses the screen
  // heading (announcing "Review changes"); every advance afterwards moves
  // focus to the new card/summary container so its content reads in
  // natural order.
  const hasFocusedHeadingRef = useRef(false);
  useEffect(() => {
    if (!hasFocusedHeadingRef.current) {
      hasFocusedHeadingRef.current = true;
      // MainContentContainer owns the heading element, so it is reached
      // by query rather than by ref.
      const heading = document.querySelector<HTMLElement>(
        ".sync-review .sub-title h3"
      );
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
        return;
      }
    }
    cardRef.current?.focus();
  }, [currentItem?.key, onSummary, isDone]);

  const decide = (
    item: IncomingItem,
    action: "accept" | "reject",
    stagedItem?: IncomingItem,
    modified = false
  ) => {
    setDecisions((previous) => ({
      ...previous,
      [item.key]: { action, item: stagedItem || item, modified },
    }));
  };

  const handleAcceptAll = () => {
    const confirmed = window.confirm(
      `Accept the remaining ${remaining.length} items without reviewing them individually?`
    );
    if (!confirmed) return;
    setDecisions((previous) => {
      const next = { ...previous };
      remaining.forEach((item) => {
        next[item.key] = { action: "accept", item, modified: false };
      });
      return next;
    });
  };

  const handleRejectAll = () => {
    const confirmed = window.confirm(
      `Reject the remaining ${remaining.length} items without reviewing them individually?`
    );
    if (!confirmed) return;
    setDecisions((previous) => {
      const next = { ...previous };
      remaining.forEach((item) => {
        next[item.key] = { action: "reject", item, modified: false };
      });
      return next;
    });
  };

  const handleCancelReview = () => {
    const confirmed = window.confirm(
      "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime."
    );
    if (!confirmed) return;
    onClearPendingReview();
    history.push("/data-management");
  };

  const handleUpload = async () => {
    if (!pendingReview) return;
    const decided = items.map((item) => decisions[item.key]);
    const acceptedItems = decided
      .filter((decision) => decision.action === "accept")
      .map((decision) => decision.item);
    const rejectedItems = decided
      .filter((decision) => decision.action === "reject")
      .map((decision) => ({ key: decision.item.key, hash: decision.item.hash }));

    setUploadState("uploading");
    try {
      await onCompleteReview({
        acceptedItems,
        rejectedItems,
        baseVersion: pendingReview.baseVersion,
      });
      setIsDone(true);
    } catch (uploadError) {
      if (
        isSyncApiError(uploadError) &&
        uploadError.code === SYNC_ERROR_CODES.VERSION_CONFLICT
      ) {
        // EC-2: staged decisions are now bound to a stale download —
        // they are discarded, never replayed (DESIGN 4.3.4).
        setUploadState("conflict");
      } else if (
        isSyncApiError(uploadError) &&
        (uploadError.code === SYNC_ERROR_CODES.BLOCKED ||
          uploadError.code === SYNC_ERROR_CODES.PARTY_CANCELED)
      ) {
        // Blocked/canceled mid-review: discard, return, and let the Data
        // Management card show the §4.2 banner + disabled re-render.
        onSetCardNotice(
          uploadError.code === SYNC_ERROR_CODES.BLOCKED ? "blocked" : "canceled"
        );
        onClearPendingReview();
        onRefreshMe();
        history.push("/data-management");
      } else {
        // Network failure: same staged set, Retry (AC-3.11/EC-3).
        setUploadState("network-failed");
      }
    }
  };

  const handleSyncAgain = async () => {
    // Fresh download → fresh review; the stale staged set is gone.
    setDecisions({});
    setUploadState("idle");
    try {
      const outcome = await onSyncAgain();
      if (outcome.type !== "review") {
        onClearPendingReview();
        history.push("/data-management");
      }
    } catch (syncError) {
      // The re-sync itself failed — never land silently on an idle card.
      // Carry a one-shot notice for the Data Management card's banner.
      if (
        isSyncApiError(syncError) &&
        syncError.code === SYNC_ERROR_CODES.BLOCKED
      ) {
        onSetCardNotice("blocked");
        onRefreshMe();
      } else if (
        isSyncApiError(syncError) &&
        syncError.code === SYNC_ERROR_CODES.PARTY_CANCELED
      ) {
        onSetCardNotice("canceled");
        onRefreshMe();
      } else {
        onSetCardNotice("connection");
      }
      onClearPendingReview();
      history.push("/data-management");
    }
  };

  // Success screen (DESIGN 4.3.4): explicit Done, no auto-redirect.
  if (isDone) {
    return (
      <MainContentContainer className="sync-review" pageTitle="Review changes">
        <div className="sync-review__card" ref={cardRef} tabIndex={-1}>
          <p role="status" className="sync-review__success">
            Synced! Your party is up to date.
          </p>
          <FormButton
            variant="primary"
            onClick={() => history.push("/data-management")}
          >
            Done
          </FormButton>
        </div>
      </MainContentContainer>
    );
  }

  // Direct navigation with nothing staged (or after an abandonment).
  if (!pendingReview || items.length === 0) {
    return (
      <MainContentContainer className="sync-review" pageTitle="Review changes">
        <div className="sync-review__card">
          <p className="sync-review__description">
            There's nothing to review right now. Sync with your party from
            Data Management to check for changes.
          </p>
          <ButtonLikeLink
            className="btn-secondary"
            to="/data-management"
            buttonTitle="Go to Data Management"
          />
        </div>
      </MainContentContainer>
    );
  }

  const decidedList = items
    .map((item) => decisions[item.key])
    .filter(Boolean);
  const acceptedCount = decidedList.filter(
    (decision) => decision.action === "accept" && !decision.modified
  ).length;
  const modifiedCount = decidedList.filter(
    (decision) => decision.action === "accept" && decision.modified
  ).length;
  const rejectedCount = decidedList.filter(
    (decision) => decision.action === "reject"
  ).length;

  return (
    <MainContentContainer className="sync-review" pageTitle="Review changes">
      {onSummary ? (
        <div ref={cardRef} tabIndex={-1}>
          <WizardSummary
            acceptedCount={acceptedCount}
            modifiedCount={modifiedCount}
            rejectedCount={rejectedCount}
            uploadState={uploadState}
            onUpload={handleUpload}
            onSyncAgain={handleSyncAgain}
            onCancelReview={handleCancelReview}
          />
        </div>
      ) : (
        <React.Fragment>
          <WizardProgress
            reviewedCount={reviewedCount}
            total={items.length}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
          />
          <div ref={cardRef} tabIndex={-1} data-testid="review-card-container">
            <ReviewItemCard
              key={currentItem.key}
              item={currentItem}
              buckets={buckets}
              unbudgetedCategories={unbudgetedCategories}
              onAccept={(stagedItem, modified) =>
                decide(currentItem, "accept", stagedItem, modified)
              }
              onReject={() => decide(currentItem, "reject")}
              onCancelReview={handleCancelReview}
            />
          </div>
        </React.Fragment>
      )}
    </MainContentContainer>
  );
};

const mapStateToProps = (state: any) => ({
  pendingReview: state.syncManager.pendingReview,
  buckets: state.expensesManager.buckets,
  unbudgetedCategories: state.expensesManager.unbudgetedCategories,
});

const mapActionsToProps = (dispatch: any) => ({
  onCompleteReview: (payload: any) => dispatch(completeReview(payload)),
  onSyncAgain: () => dispatch(syncWithParty()),
  onClearPendingReview: () => dispatch(clearPendingReview()),
  onRefreshMe: () => dispatch(refreshMe()),
  onSetCardNotice: (cardNotice: SyncCardNotice) =>
    dispatch({ type: SYNC_CARD_NOTICE_SET, payload: { cardNotice } }),
});

export default connect(mapStateToProps, mapActionsToProps)(SyncReview);
