import React, { useState } from "react";
import { connect } from "react-redux";
import { Button } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import ButtonLikeLink from "../common/ButtonLikeLink";
import { logOut } from "../../redux/syncManager/actionCreators";
import { getInitials } from "../../helpers/general";
import { SyncSession } from "../../services/session";
import "./styles.scss";

interface AccountProps {
  session: SyncSession | null;
  onLogOut: () => void;
}

/**
 * Account hub (DESIGN §2.1/§2.3): the logged-out view offers Sign in /
 * Sign up; the logged-in view shows who is signed in and a Log out button.
 * Logout needs no confirmation (reversible, low-stakes) and announces a
 * transient status line (AC-1.4). The Party row lands with parties in PR 2.
 */
const Account = ({ session, onLogOut }: AccountProps) => {
  const [justSignedOut, setJustSignedOut] = useState(false);

  const handleLogOut = () => {
    onLogOut();
    setJustSignedOut(true);
  };

  return (
    <MainContentContainer className="account-screen" pageTitle="Account">
      {session ? (
        <div className="account-card">
          <div className="account-card__identity">
            <span className="account-card__initials" aria-hidden="true">
              {getInitials(session.user)}
            </span>
            <div>
              <p className="account-card__name">
                {session.user.firstName} {session.user.lastName}
              </p>
              <p className="account-card__email">{session.user.email}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="full-width"
            onClick={handleLogOut}
          >
            Log out
          </Button>
        </div>
      ) : (
        <div className="account-card">
          {justSignedOut && (
            <p role="status" className="account-card__status">
              Signed out. Your data stays on this device.
            </p>
          )}
          <p className="account-card__description">
            Sign in to sync your entries across devices with your party.
          </p>
          <ButtonLikeLink
            className="btn-primary"
            to="/sign-in"
            buttonTitle="Sign in"
          />
          <ButtonLikeLink
            className="btn-secondary"
            to="/sign-up"
            buttonTitle="Sign up"
          />
          <p className="account-card__reassurance text-secondary">
            Everything still works without an account — this is only needed
            for syncing with a party.
          </p>
        </div>
      )}
    </MainContentContainer>
  );
};

const mapStateToProps = (state: any) => ({
  session: state.syncManager.session,
});

const mapActionsToProps = (dispatch: any) => ({
  onLogOut: () => dispatch(logOut()),
});

export default connect(mapStateToProps, mapActionsToProps)(Account);
