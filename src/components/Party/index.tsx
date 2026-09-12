import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import ButtonLikeLink from "../common/ButtonLikeLink";
import NoPartyView from "./NoPartyView";
import PartyDetailView from "./PartyDetailView";
import {
  blockMember,
  cancelParty,
  createParty,
  refreshMe,
} from "../../redux/syncManager/actionCreators";
import { SyncSession } from "../../services/session";
import {
  Party as PartyShape,
  PartyMember,
} from "../../services/syncApi/contract";
import "./styles.scss";

interface PartyProps {
  session: SyncSession | null;
  party: PartyShape | null;
  // Whether the initial GET /me membership check has come back — *not* whether
  // a party was found. `party === null` means "no party" once this is true and
  // "we don't know yet" while it is false.
  partyStatusResolved: boolean;
  onRefreshMe: () => void;
  onCreateParty: () => Promise<PartyShape>;
  onBlockMember: (payload: { userId: string }) => Promise<PartyShape>;
  onCancelParty: () => Promise<PartyShape>;
}

// Exact copy from docs/multi-user-sync/DESIGN.md §3.6.
const BLOCKED_STATUS = "You've been removed from this party by its organizer.";
const CANCELED_STATUS =
  "Your party was canceled. Create or join a new one to sync again.";

/**
 * Party hub (docs/multi-user-sync/DESIGN.md §3): picks between the no-party,
 * organizer, member, blocked and canceled views, and owns the actions that
 * change membership — create, block, cancel — including their confirmation
 * dialogs.
 *
 * Membership is refreshed from GET /me on mount rather than trusted from the
 * store, because it is never cached as authoritative
 * (docs/multi-user-sync/RFC.md §2.2) — another member may have changed it
 * since this tab last looked. That refresh is also what surfaces the blocked
 * and canceled states to the members they happened to.
 */
const Party = ({
  session,
  party,
  partyStatusResolved,
  onRefreshMe,
  onCreateParty,
  onBlockMember,
  onCancelParty,
}: PartyProps) => {
  const history = useHistory();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onRefreshMe();
  }, [onRefreshMe]);

  // Every membership action fails the same way: show the server's message
  // and re-ask /me, since a stale tab that missed a membership change is the
  // likeliest reason for the failure.
  const runMembershipAction = async (
    action: () => Promise<unknown>,
    fallbackMessage: string
  ) => {
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError((actionError as Error).message || fallbackMessage);
      onRefreshMe();
    }
  };

  const handleCreateParty = () => {
    // Same confirm pattern as "Clear all data" (DESIGN §3.1; AC-2.1,
    // docs/multi-user-sync/PRD.md): creating a party is not undoable here.
    const confirmed = window.confirm(
      "Create a party? You'll become its organizer and can invite family members."
    );
    if (!confirmed) return;
    runMembershipAction(onCreateParty, "Could not create the party.");
  };

  // AC-2.9: the confirmation carries the consequences (DESIGN §3.2).
  const handleBlockClick = (member: PartyMember) => {
    const confirmed = window.confirm(
      `Block ${member.firstName} ${member.lastName}? This cannot be undone. They'll immediately lose the ability to sync, and entries they've already contributed stay in the party's history.`
    );
    if (!confirmed) return;
    runMembershipAction(
      () => onBlockMember({ userId: member.id }),
      "Could not block the member."
    );
  };

  // AC-2.10: likewise for cancelling (DESIGN §3.2).
  const handleCancelClick = () => {
    if (!party) return;
    const confirmed = window.confirm(
      `Cancel ${party.name}? This cannot be undone. No member will be able to sync afterward, and nobody's local data is deleted.`
    );
    if (!confirmed) return;
    runMembershipAction(onCancelParty, "Could not cancel the party.");
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
      ) : party && party.youAreBlocked ? (
        // DESIGN §3.6: a blocked member gets the no-party layout, since they
        // are free to create or join elsewhere. Checked before `canceled` so
        // someone who was blocked hears the reason that applies to them.
        <NoPartyView
          onCreateClick={handleCreateParty}
          error={error}
          statusLine={BLOCKED_STATUS}
        />
      ) : party && party.canceled ? (
        <NoPartyView
          onCreateClick={handleCreateParty}
          error={error}
          statusLine={CANCELED_STATUS}
        />
      ) : party ? (
        <PartyDetailView
          party={party}
          selfId={session.user.id}
          error={error}
          onBlockClick={handleBlockClick}
          onCancelClick={handleCancelClick}
        />
      ) : partyStatusResolved ? (
        // No party in the store *and* the membership check has come back, so
        // this is a real "no party" rather than a not-yet-answered one.
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
  partyStatusResolved: state.syncManager.partyStatusResolved,
});

const mapActionsToProps = (dispatch: any) => ({
  onRefreshMe: () => dispatch(refreshMe()),
  onCreateParty: () => dispatch(createParty()),
  onBlockMember: (payload: { userId: string }) =>
    dispatch(blockMember(payload)),
  onCancelParty: () => dispatch(cancelParty()),
});

export default connect(mapStateToProps, mapActionsToProps)(Party);
