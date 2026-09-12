import React from "react";
import { Button } from "react-bootstrap";
import ButtonLikeLink from "../common/ButtonLikeLink";
import MemberRow from "./MemberRow";
import {
  Party as PartyShape,
  PartyMember,
} from "../../services/syncApi/contract";

interface PartyDetailViewProps {
  party: PartyShape;
  selfId: string;
  // The last block/cancel failure, surfaced in the card; null when none.
  error: string | null;
  // Both fire only from the organizer's controls; the hub owns the
  // confirmation dialogs and the thunks.
  onBlockClick: (member: PartyMember) => void;
  onCancelClick: () => void;
}

/**
 * The party itself (docs/multi-user-sync/DESIGN.md §3.2/§3.3): the member
 * list everyone sees, plus the organizer-only actions — Add a member, a
 * Block button on every other active row, and Cancel party (AC-2.9, AC-2.10,
 * AC-2.12, docs/multi-user-sync/PRD.md). Whether the viewer is the organizer
 * is decided from the party's own organizerId rather than passed in, so a
 * member can never be rendered the organizer's controls by a caller's
 * mistake.
 */
const PartyDetailView = ({
  party,
  selfId,
  error,
  onBlockClick,
  onCancelClick,
}: PartyDetailViewProps) => {
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
            // AC-2.12: only the organizer blocks, and never their own row.
            onBlock={
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

export default PartyDetailView;
