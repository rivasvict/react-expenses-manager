import React from "react";
import { Button } from "react-bootstrap";
import { PartyMember } from "../../services/syncApi/contract";
import { useTranslation } from "../../i18n";

interface MemberRowProps {
  member: PartyMember;
  isSelf: boolean;
  isOrganizer: boolean;
  // Present only when the viewer may block this member — the organizer
  // looking at someone else's active row (AC-2.12,
  // docs/multi-user-sync/PRD.md). The caller decides that and owns the
  // confirmation; the row only offers the button.
  onBlock?: () => void;
}

/**
 * One static row of the party member list (docs/multi-user-sync/DESIGN.md
 * §3.2): name and email, plus a right-aligned status — an Organizer badge, a
 * Block button (organizer view, AC-2.9), a muted "Blocked" label, or nothing.
 * There is no un-block affordance: out of scope by design.
 */
const MemberRow = ({ member, isSelf, isOrganizer, onBlock }: MemberRowProps) => {
  const { t } = useTranslation();
  return (
    <li className="member-row">
      <div className="member-row__identity">
        <span className="member-row__name">
          {member.firstName} {member.lastName}
          {isSelf && (
            <span className="member-row__you"> {t("memberRow.you")}</span>
          )}
        </span>
        <span className="member-row__email">{member.email}</span>
      </div>
      {isOrganizer && (
        <span className="member-row__badge">{t("party.organizer")}</span>
      )}
      {!isOrganizer && member.blocked && (
        <span className="member-row__blocked">{t("memberRow.blocked")}</span>
      )}
      {!isOrganizer && !member.blocked && onBlock && (
        <Button
          variant="secondary"
          className="member-row__block"
          aria-label={t("memberRow.blockLabel", {
            firstName: member.firstName,
            lastName: member.lastName,
          })}
          onClick={onBlock}
        >
          {t("memberRow.block")}
        </Button>
      )}
    </li>
  );
};

export default MemberRow;
