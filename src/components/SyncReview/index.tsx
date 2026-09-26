import React, { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import { Prompt, useHistory } from "react-router-dom";
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
import { SYNC_DECLINED_SET } from "../../redux/syncManager/actions";
import { PendingReview, DeclinedReason } from "../../redux/syncManager/reducer";
import {
  groupIncomingItems,
  groupItemsWith,
  IncomingItem,
  ReviewGroup,
} from "../../helpers/syncMergeHelper/syncMergeHelper";
import {
  SYNC_ERROR_CODES,
  isSyncApiError,
} from "../../services/syncApi/contract";
import { useTranslation } from "../../i18n";
import "./styles.scss";

interface Decision {
  action: "accept" | "reject";
  // Every item the card's decision covers — one for an entry or an edit, a
  // brand-new definition's whole history for a grouped card
  // (docs/multi-user-sync/RFC.md §4.1).
  // For accepted cards these may carry modified values (EC-5); for
  // rejections they stay the originals, whose hashes feed the memory.
  items: IncomingItem[];
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
  onSetDeclined: (declined: DeclinedReason) => void;
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
  onSetDeclined,
}: SyncReviewProps) => {
  const { t } = useTranslation();
  const leaveReviewConfirmation = t("syncReview.leaveConfirm");
  const history = useHistory();
  const [decisions, setDecisions] = useState<{ [key: string]: Decision }>({});
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [isDone, setIsDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Set just before the wizard navigates on purpose, so the route guard
  // below does not ask a second time on top of the flow's own confirm.
  const isLeavingDeliberately = useRef(false);

  // RFC §4.1: a brand-new fixed entry / bucket is ONE card covering all of
  // its history states; everything else is one card per item.
  // The empty-list fallback lives inside the callback so the
  // memo depends on the stable `pendingReview` rather than on an array that
  // would be freshly allocated — and so recompute — on every render.
  const groups = useMemo(
    () => groupIncomingItems(pendingReview ? pendingReview.items : []),
    [pendingReview]
  );
  const remaining = groups.filter((group) => !decisions[group.key]);
  const currentGroup = remaining[0];
  const reviewedCount = groups.length - remaining.length;
  const onSummary = groups.length > 0 && remaining.length === 0;
  const hasStagedDecisions = reviewedCount > 0;

  // Focus management (DESIGN §5): mount and every advance move focus to
  // the card container so the new content reads in natural order.
  useEffect(() => {
    cardRef.current?.focus();
  }, [currentGroup?.key, onSummary, isDone]);

  const leaveFor = (path: string) => {
    isLeavingDeliberately.current = true;
    history.push(path);
  };

  const decide = (
    group: ReviewGroup,
    action: "accept" | "reject",
    stagedItem?: IncomingItem,
    modified = false
  ) => {
    setDecisions((previous) => ({
      ...previous,
      [group.key]: {
        action,
        items: groupItemsWith(group, stagedItem),
        modified,
      },
    }));
  };

  const handleAcceptAll = () => {
    const confirmed = window.confirm(
      `Accept the remaining ${remaining.length} items without reviewing them individually?`
    );
    if (!confirmed) return;
    setDecisions((previous) => {
      const next = { ...previous };
      remaining.forEach((group) => {
        next[group.key] = {
          action: "accept",
          items: group.items,
          modified: false,
        };
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
      remaining.forEach((group) => {
        next[group.key] = {
          action: "reject",
          items: group.items,
          modified: false,
        };
      });
      return next;
    });
  };

  const handleCancelReview = () => {
    const confirmed = window.confirm(leaveReviewConfirmation);
    if (!confirmed) return;
    onClearPendingReview();
    leaveFor("/data-management");
  };

  const handleUpload = async () => {
    if (!pendingReview) return;
    const decided = groups.map((group) => decisions[group.key]);
    const acceptedItems = decided
      .filter((decision) => decision.action === "accept")
      .reduce(
        (all: IncomingItem[], decision) => all.concat(decision.items),
        []
      );
    const rejectedItems = decided
      .filter((decision) => decision.action === "reject")
      .reduce(
        (all: { key: string; hash: string }[], decision) =>
          all.concat(
            decision.items.map((item) => ({ key: item.key, hash: item.hash }))
          ),
        []
      );

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
        onSetDeclined(
          uploadError.code === SYNC_ERROR_CODES.BLOCKED ? "blocked" : "canceled"
        );
        onClearPendingReview();
        onRefreshMe();
        leaveFor("/data-management");
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
        leaveFor("/data-management");
      }
    } catch (syncError) {
      onClearPendingReview();
      leaveFor("/data-management");
    }
  };

  // AC-3.11: the explicit Cancel confirms before dropping staged decisions,
  // so leaving through the app nav must ask the same question instead of
  // silently discarding them. Returning `true` lets the wizard's own
  // deliberate navigations through without a second prompt.
  const routeGuard = (
    <Prompt
      when={hasStagedDecisions && !isDone && uploadState !== "uploading"}
      message={() =>
        isLeavingDeliberately.current ? true : leaveReviewConfirmation
      }
    />
  );

  // Success screen (DESIGN 4.3.4): explicit Done, no auto-redirect.
  if (isDone) {
    return (
      <MainContentContainer
        className="sync-review"
        pageTitle={t("syncReview.pageTitle")}
      >
        <div className="sync-review__card" ref={cardRef} tabIndex={-1}>
          <p role="status" className="sync-review__success">
            {t("syncReview.success")}
          </p>
          <FormButton
            variant="primary"
            onClick={() => history.push("/data-management")}
          >
            {t("invite.done")}
          </FormButton>
        </div>
      </MainContentContainer>
    );
  }

  // Direct navigation with nothing staged (or after an abandonment).
  if (!pendingReview || groups.length === 0) {
    return (
      <MainContentContainer
        className="sync-review"
        pageTitle={t("syncReview.pageTitle")}
      >
        <div className="sync-review__card">
          <p className="sync-review__description">
            {t("syncReview.nothingToReview")}
          </p>
          <ButtonLikeLink
            className="btn-secondary"
            to="/data-management"
            buttonTitle={t("syncReview.goToDataManagement")}
          />
        </div>
      </MainContentContainer>
    );
  }

  const decidedList = groups
    .map((group) => decisions[group.key])
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
    <MainContentContainer
      className="sync-review"
      pageTitle={t("syncReview.pageTitle")}
    >
      {routeGuard}
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
            total={groups.length}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
          />
          <div ref={cardRef} tabIndex={-1}>
            <ReviewItemCard
              key={currentGroup.key}
              item={currentGroup.item}
              stateCount={currentGroup.items.length}
              buckets={buckets}
              unbudgetedCategories={unbudgetedCategories}
              onAccept={(stagedItem, modified) =>
                decide(currentGroup, "accept", stagedItem, modified)
              }
              onReject={() => decide(currentGroup, "reject")}
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
  onSetDeclined: (declined: DeclinedReason) =>
    dispatch({ type: SYNC_DECLINED_SET, payload: { declined } }),
});

export default connect(mapStateToProps, mapActionsToProps)(SyncReview);
