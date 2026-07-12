import React from "react";
import { PartyMember } from "../../services/syncApi/contract";

interface MemberRowProps {
  member: PartyMember;
  isSelf: boolean;
  isOrganizer: boolean;
}

/**
 * One static row of the party member list (DESIGN §3.2): name/email plus a
 * right-aligned status — an Organizer badge, a muted "Blocked" label, or
 * nothing. The organizer's Block button joins in the party-management PR.
 */
const MemberRow = ({ member, isSelf, isOrganizer }: MemberRowProps) => (
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
  </li>
);

export default MemberRow;
