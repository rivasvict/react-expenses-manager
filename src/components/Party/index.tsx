import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import ButtonLikeLink from "../common/ButtonLikeLink";
import MemberRow from "./MemberRow";
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

// DESIGN §3.1 — logged in, no party yet: create or join.
const NoPartyView = ({
  onCreateClick,
  error,
}: {
  onCreateClick: () => void;
  error: string | null;
}) => (
  <React.Fragment>
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
// organizer-only actions (AC-2.12). Block/Cancel land in the next PR.
const PartyDetailView = ({
  party,
  selfId,
}: {
  party: PartyShape;
  selfId: string;
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
          />
        ))}
      </ul>
      {isOrganizer && party.members.length === 1 && (
        <p className="party-card__hint text-secondary">
          Invite family members to start syncing.
        </p>
      )}
      {isOrganizer ? (
        <ButtonLikeLink
          className="btn-primary"
          to="/party/invite"
          buttonTitle="Add a member"
        />
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
 * Party hub (DESIGN §3): renders the no-party, organizer or member view.
 * Membership is refreshed from GET /me on mount (RFC §2.2 — never cached
 * as authoritative).
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
    // Same confirm pattern as "Clear all data" (DESIGN §3.1, AC-2.1).
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
