import React from "react";
import { Button } from "react-bootstrap";
import { PartyMember } from "../../services/syncApi/contract";

interface MemberRowProps {
  member: PartyMember;
  isSelf: boolean;
  isOrganizer: boolean;
  // Present only when the viewer may block this member (organizer viewing
  // an active, non-self row — AC-2.12); the parent owns the confirm.
  onBlock?: () => void;
}

/**
 * One static row of the party member list (DESIGN §3.2): name/email plus a
 * right-aligned status — an Organizer badge, a Block button (organizer
 * view, AC-2.9), a muted "Blocked" label, or nothing. There is no
 * un-block affordance — out of scope by design.
 */
const MemberRow = ({ member, isSelf, isOrganizer, onBlock }: MemberRowProps) => (
  <li className="member-row">
    <div className="member-row__identity">
      <span className="member-row__name">
        {member.firstName} {member.lastName}
        {isSelf && <span className="member-row__you"> (you)</span>}
      </span>
      <span className="member-row__email">{member.email}</span>
    </div>
    {isOrganizer && <span className="member-row__badge">Organizer</span>}
    {!isOrganizer && member.blocked && (
      <span className="member-row__blocked">Blocked</span>
    )}
    {!isOrganizer && !member.blocked && onBlock && (
      <Button
        variant="secondary"
        className="member-row__block"
        aria-label={`Block ${member.firstName} ${member.lastName}`}
        onClick={onBlock}
      >
        Block
      </Button>
    )}
  </li>
);

export default MemberRow;
