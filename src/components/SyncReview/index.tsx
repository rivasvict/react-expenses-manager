import React from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import { clearPendingReview } from "../../redux/syncManager/syncThunk";
import "./styles.scss";

interface SyncReviewProps {
  pendingReviewCount: number | null;
  onClearPendingReview: () => void;
}

/**
 * Minimal /sync-review placeholder: the full item-by-item review wizard
 * (docs/multi-user-sync/DESIGN.md §4.3) lands in a later PR. Until then the
 * only offered action is Cancel review — DESIGN §4.3's safe-abandonment
 * rule: nothing has been applied (decisions would be staged in component
 * state only, docs/multi-user-sync/RFC.md §4.3 step 4), so canceling
 * changes nothing on this device.
 */
const SyncReview = ({
  pendingReviewCount,
  onClearPendingReview,
}: SyncReviewProps) => {
  const history = useHistory();

  const handleCancelReview = () => {
    const confirmed = window.confirm(
      "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime."
    );
    if (!confirmed) return;
    onClearPendingReview();
    history.push("/data-management");
  };

  return (
    <MainContentContainer className="sync-review" pageTitle="Review changes">
      <div className="sync-review__card">
        <p className="sync-review__description">
          {pendingReviewCount === null
            ? "Your party has changes to review."
            : `Your party has ${pendingReviewCount} incoming ${
                pendingReviewCount === 1 ? "change" : "changes"
              } to review.`}{" "}
          Reviewing changes item by item arrives in a later update — nothing
          is applied to this device until you review it.
        </p>
        <Button
          variant="secondary"
          className="full-width"
          onClick={handleCancelReview}
        >
          Cancel review
        </Button>
      </div>
    </MainContentContainer>
  );
};

const mapStateToProps = (state: any) => ({
  pendingReviewCount: state.syncManager.pendingReviewCount,
});

const mapActionsToProps = (dispatch: any) => ({
  onClearPendingReview: () => dispatch(clearPendingReview()),
});

export default connect(mapStateToProps, mapActionsToProps)(SyncReview);
