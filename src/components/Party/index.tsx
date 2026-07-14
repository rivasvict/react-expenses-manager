import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import ButtonLikeLink from "../common/ButtonLikeLink";
import MemberRow from "./MemberRow";
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
  partyLoaded: boolean;
  onRefreshMe: () => void;
  onCreateParty: () => Promise<PartyShape>;
  onBlockMember: (payload: { userId: string }) => Promise<PartyShape>;
  onCancelParty: () => Promise<PartyShape>;
}

// DESIGN §3.1 — logged in, no party yet: create or join. Also the shell
// for the blocked/canceled views (DESIGN §3.6), which reuse this CTA
// layout with a status line on top — both states leave the user free to
// create/join elsewhere.
const NoPartyView = ({
  onCreateClick,
  error,
  statusLine,
}: {
  onCreateClick: () => void;
  error: string | null;
  statusLine?: string;
}) => (
  <React.Fragment>
    {statusLine && (
      <p className="party-card__status" role="status">
        {statusLine}
      </p>
    )}
    <div className="party-card">
      <h2 className="party-card__title">Create a party</h2>
      <p className="party-card__description">
        Start a party to sync entries with family members.
      </p>
      {error && (
        <p
          className="restore-backup-error text-danger vertical-standard-space"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button variant="primary" className="full-width" onClick={onCreateClick}>
        Create a party
      </Button>
    </div>
    <div className="party-card">
      <h2 className="party-card__title">Join a party</h2>
      <p className="party-card__description">
        Have an invitation code? Join the party that invited you.
      </p>
      <ButtonLikeLink
        className="btn-secondary"
        to="/party/join"
        buttonTitle="Join a party"
      />
    </div>
  </React.Fragment>
);

// DESIGN §3.2/§3.3 — the party detail: member list for everyone,
// organizer-only actions (AC-2.12).
const PartyDetailView = ({
  party,
  selfId,
  error,
  onBlockClick,
  onCancelClick,
}: {
  party: PartyShape;
  selfId: string;
  error: string | null;
  onBlockClick: (member: PartyMember) => void;
  onCancelClick: () => void;
}) => {
  const isOrganizer = party.organizerId === selfId;
  const organizer = party.members.find(
    (member) => member.id === party.organizerId
  );
  return (
    <div className="party-card">
      <div className="party-card__header">
        <h2 className="party-card__title">{party.name}</h2>
        {isOrganizer && <span className="party-card__badge">Organizer</span>}
      </div>
      <ul className="party-card__members">
        {party.members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isSelf={member.id === selfId}
            isOrganizer={member.id === party.organizerId}
            onBlock={
              // AC-2.12: only the organizer blocks; never self.
              isOrganizer && member.id !== selfId
                ? () => onBlockClick(member)
                : undefined
            }
          />
        ))}
      </ul>
      {error && (
        <p
          className="restore-backup-error text-danger vertical-standard-space"
          role="alert"
        >
          {error}
        </p>
      )}
      {isOrganizer && party.members.length === 1 && (
        <p className="party-card__hint text-secondary">
          Invite family members to start syncing.
        </p>
      )}
      {isOrganizer ? (
        <React.Fragment>
          <ButtonLikeLink
            className="btn-primary"
            to="/party/invite"
            buttonTitle="Add a member"
          />
          <Button
            variant="danger"
            className="full-width vertical-standard-space"
            onClick={onCancelClick}
          >
            Cancel party
          </Button>
        </React.Fragment>
      ) : (
        <p className="party-card__hint text-secondary">
          Only {organizer ? organizer.firstName : "the organizer"}, the
          organizer, can add or remove members.
        </p>
      )}
    </div>
  );
};

/**
 * Party hub (DESIGN §3): renders the no-party, organizer, member, blocked
 * or canceled view. Membership is refreshed from GET /me on mount
 * (RFC §2.2 — never cached as authoritative), which is what re-renders
 * the blocked/canceled states for affected members.
 */
const Party = ({
  session,
  party,
  partyLoaded,
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

  const runWithErrorHandling = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError((actionError as Error).message || "Something went wrong.");
      // A stale tab may have missed a membership change — refresh.
      onRefreshMe();
    }
  };

  const handleCreateParty = () => {
    // Same confirm pattern as "Clear all data" (DESIGN §3.1, AC-2.1).
    const confirmed = window.confirm(
      "Create a party? You'll become its organizer and can invite family members."
    );
    if (!confirmed) return;
    runWithErrorHandling(onCreateParty);
  };

  // AC-2.9 — blocking is guarded by a confirm carrying the consequences.
  const handleBlockClick = (member: PartyMember) => {
    const confirmed = window.confirm(
      `Block ${member.firstName} ${member.lastName}? They'll immediately lose the ability to sync. Entries they've already contributed stay in the party's history.`
    );
    if (!confirmed) return;
    runWithErrorHandling(() => onBlockMember({ userId: member.id }));
  };

  // AC-2.10 — canceling is guarded the same way.
  const handleCancelClick = () => {
    if (!party) return;
    const confirmed = window.confirm(
      `Cancel ${party.name}? No member will be able to sync afterward. Nobody's local data is deleted.`
    );
    if (!confirmed) return;
    runWithErrorHandling(onCancelParty);
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
        // DESIGN §3.6 — blocked members see the no-party CTA layout.
        <NoPartyView
          onCreateClick={handleCreateParty}
          error={error}
          statusLine="You've been removed from this party by its organizer."
        />
      ) : party && party.canceled ? (
        // DESIGN §3.6 — members of a canceled party likewise.
        <NoPartyView
          onCreateClick={handleCreateParty}
          error={error}
          statusLine="Your party was canceled. Create or join a new one to sync again."
        />
      ) : party ? (
        <PartyDetailView
          party={party}
          selfId={session.user.id}
          error={error}
          onBlockClick={handleBlockClick}
          onCancelClick={handleCancelClick}
        />
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
  onBlockMember: (payload: { userId: string }) => dispatch(blockMember(payload)),
  onCancelParty: () => dispatch(cancelParty()),
});

export default connect(mapStateToProps, mapActionsToProps)(Party);
