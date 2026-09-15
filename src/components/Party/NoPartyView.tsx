import React from "react";
import { Button } from "react-bootstrap";
import ButtonLikeLink from "../common/ButtonLikeLink";

interface NoPartyViewProps {
  onCreateClick: () => void;
  error: string | null;
  // A line above the two cards saying why the user is here: shown to a
  // blocked member, or a member of a canceled party, who is free to start
  // over (docs/multi-user-sync/DESIGN.md §3.6). Absent for a plain "no
  // party yet".
  statusLine?: string;
}

/**
 * Logged in with no party yet (docs/multi-user-sync/DESIGN.md §3.1): the two
 * ways in, side by side. Creating is the primary action and happens here;
 * joining needs an invitation code, so it routes to its own screen. The
 * blocked and canceled states (§3.6) reuse this layout with a status line on
 * top — both leave the user free to create or join elsewhere.
 */
const NoPartyView = ({ onCreateClick, error, statusLine }: NoPartyViewProps) => (
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

export default NoPartyView;
