import React from "react";
import ButtonLikeLink from "../common/ButtonLikeLink";
import MemberRow from "./MemberRow";
import { Party as PartyShape } from "../../services/syncApi/contract";

interface PartyDetailViewProps {
  party: PartyShape;
  selfId: string;
}

/**
 * The party itself (docs/multi-user-sync/DESIGN.md §3.2/§3.3): the member
 * list everyone sees, plus the organizer-only actions (AC-2.12,
 * docs/multi-user-sync/PRD.md). Whether the viewer is the organizer is
 * decided from the party's own organizerId rather than passed in, so a member
 * can never be rendered the organizer's controls by a caller's mistake.
 * Block and Cancel arrive in a later PR.
 */
const PartyDetailView = ({ party, selfId }: PartyDetailViewProps) => {
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

export default PartyDetailView;
