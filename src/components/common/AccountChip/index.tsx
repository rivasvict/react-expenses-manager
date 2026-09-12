import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import accountIcon from "@iconify-icons/codicon/account";
import { getInitials } from "../../../helpers/general";
import { SyncSession } from "../../../services/session";
import "./styles.scss";

interface AccountChipProps {
  session: SyncSession | null;
}

/**
 * Account entry point in the app bar (docs/multi-user-sync/DESIGN.md §1 and
 * §5): a circular icon-button showing a generic glyph when logged out and the
 * user's initials when logged in. Present at every viewport, independent of
 * the tab bar's collapse.
 */
const AccountChip = ({ session }: AccountChipProps) => {
  const user = session?.user;
  const accountLabel = user
    ? `Account: ${user.firstName} ${user.lastName}`
    : "Account";
  return (
    <Link
      to="/account"
      className={`account-chip ${user ? "account-chip--logged-in" : ""}`}
      aria-label={accountLabel}
    >
      {user ? (
        <span aria-hidden="true">{getInitials(user)}</span>
      ) : (
        <Icon
          icon={accountIcon}
          className="account-chip__icon"
          aria-hidden="true"
        />
      )}
    </Link>
  );
};

export default AccountChip;
