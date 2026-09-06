import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import ButtonLikeLink from "../common/ButtonLikeLink";
import NoPartyView from "./NoPartyView";
import PartyDetailView from "./PartyDetailView";
import {
  createParty,
  refreshMe,
} from "../../redux/syncManager/actionCreators";
import { SyncSession } from "../../services/session";
import { Party as PartyShape } from "../../services/syncApi/contract";
import "./styles.scss";

interface PartyProps {
  session: SyncSession | null;
  party: PartyShape | null;
  partyLoaded: boolean;
  onRefreshMe: () => void;
  onCreateParty: () => Promise<PartyShape>;
}

/**
 * Party hub (docs/multi-user-sync/DESIGN.md §3): picks between the no-party,
 * organizer and member views, and owns the create-a-party action.
 *
 * Membership is refreshed from GET /me on mount rather than trusted from the
 * store, because it is never cached as authoritative
 * (docs/multi-user-sync/RFC.md §2.2) — another member may have changed it
 * since this tab last looked.
 */
const Party = ({
  session,
  party,
  partyLoaded,
  onRefreshMe,
  onCreateParty,
}: PartyProps) => {
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onRefreshMe();
  }, [onRefreshMe]);

  const handleCreateParty = async () => {
    // Same confirm pattern as "Clear all data" (DESIGN §3.1; AC-2.1,
    // docs/multi-user-sync/PRD.md): creating a party is not undoable here.
    const confirmed = window.confirm(
      "Create a party? You'll become its organizer and can invite family members."
    );
    if (!confirmed) return;
    setError(null);
    try {
      await onCreateParty();
    } catch (createError) {
      setError(
        (createError as Error).message || "Could not create the party."
      );
      // A stale tab may have missed a membership change — refresh.
      onRefreshMe();
    }
  };

  return (
    <MainContentContainer className="party-screen" pageTitle="Party">
      {!session ? (
        <div className="party-card">
          <p className="party-card__description">
            Sign in to create or join a party.
          </p>
          <ButtonLikeLink
            className="btn-primary"
            to="/account"
            buttonTitle="Go to Account"
          />
        </div>
      ) : party ? (
        <PartyDetailView party={party} selfId={session.user.id} />
      ) : partyLoaded ? (
        <NoPartyView onCreateClick={handleCreateParty} error={error} />
      ) : (
        <p className="party-card__hint text-secondary" role="status">
          Loading your party…
        </p>
      )}
      <Button
        variant="secondary"
        className="full-width vertical-standard-space"
        onClick={() => history.goBack()}
      >
        Go Back
      </Button>
    </MainContentContainer>
  );
};

const mapStateToProps = (state: any) => ({
  session: state.syncManager.session,
  party: state.syncManager.party,
  partyLoaded: state.syncManager.partyLoaded,
});

const mapActionsToProps = (dispatch: any) => ({
  onRefreshMe: () => dispatch(refreshMe()),
  onCreateParty: () => dispatch(createParty()),
});

export default connect(mapStateToProps, mapActionsToProps)(Party);
