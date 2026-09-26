// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React, { useState } from "react";
import { connect } from "react-redux";
import { Button } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import ButtonLikeLink from "../common/ButtonLikeLink";
import ContentTileSection from "../common/ContentTitleSection";
import { logOut } from "../../redux/syncManager/actionCreators";
import { getInitials } from "../../helpers/general";
import { SyncSession } from "../../services/session";
import { useTranslation } from "../../i18n";
import "./styles.scss";

interface AccountProps {
  session: SyncSession | null;
  onLogOut: () => void;
}

/**
 * Account hub (docs/multi-user-sync/DESIGN.md §2.1/§2.3): the logged-out view
 * offers Sign in / Sign up; the logged-in view shows who is signed in and a
 * Log out button. Logout needs no confirmation (reversible, low-stakes) and
 * announces a transient status line (AC-1.4, docs/multi-user-sync/PRD.md).
 */
const Account = ({ session, onLogOut }: AccountProps) => {
  const { t } = useTranslation();
  const [justSignedOut, setJustSignedOut] = useState(false);

  const handleLogOut = () => {
    onLogOut();
    setJustSignedOut(true);
  };

  return (
    <MainContentContainer
      className="account-screen"
      pageTitle={t("account.pageTitle")}
    >
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
          {/* docs/multi-user-sync/DESIGN.md §2.3: the party hub is reached
              from the account. */}
          <ContentTileSection title={t("party.pageTitle")} to="/party">
            {t("party.pageTitle")}
          </ContentTileSection>
          <Button
            variant="secondary"
            className="full-width"
            onClick={handleLogOut}
          >
            {t("account.logOut")}
          </Button>
        </div>
      ) : (
        <div className="account-card">
          {justSignedOut && (
            <p role="status" className="account-card__status">
              {t("account.signedOut")}
            </p>
          )}
          <p className="account-card__description">
            {t("account.description")}
          </p>
          <ButtonLikeLink
            className="btn-primary"
            to="/sign-in"
            buttonTitle={t("account.signIn")}
          />
          <ButtonLikeLink
            className="btn-secondary"
            to="/sign-up"
            buttonTitle={t("account.signUp")}
          />
          <p className="account-card__reassurance text-secondary">
            {t("account.reassurance")}
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
