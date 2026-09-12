import React from "react";
import { Button } from "react-bootstrap";
import ButtonLikeLink from "../common/ButtonLikeLink";

interface NoPartyViewProps {
  onCreateClick: () => void;
  error: string | null;
}

/**
 * Logged in with no party yet (docs/multi-user-sync/DESIGN.md §3.1): the two
 * ways in, side by side. Creating is the primary action and happens here;
 * joining needs an invitation code, so it routes to its own screen.
 */
const NoPartyView = ({ onCreateClick, error }: NoPartyViewProps) => (
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

export default NoPartyView;
