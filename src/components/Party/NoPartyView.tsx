import React from "react";
import { Button } from "react-bootstrap";
import ButtonLikeLink from "../common/ButtonLikeLink";
import { useTranslation } from "../../i18n";

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
const NoPartyView = ({
  onCreateClick,
  error,
  statusLine,
}: NoPartyViewProps) => {
  const { t } = useTranslation();
  return (
    <React.Fragment>
      {statusLine && (
        <p className="party-card__status" role="status">
          {statusLine}
        </p>
      )}
      <div className="party-card">
        <h2 className="party-card__title">{t("party.create")}</h2>
        <p className="party-card__description">
          {t("party.createDescription")}
        </p>
        {error && (
          <p
            className="restore-backup-error text-danger vertical-standard-space"
            role="alert"
          >
            {error}
          </p>
        )}
        <Button
          variant="primary"
          className="full-width"
          onClick={onCreateClick}
        >
          {t("party.create")}
        </Button>
      </div>
      <div className="party-card">
        <h2 className="party-card__title">{t("party.join")}</h2>
        <p className="party-card__description">{t("party.joinDescription")}</p>
        <ButtonLikeLink
          className="btn-secondary"
          to="/party/join"
          buttonTitle={t("party.join")}
        />
      </div>
    </React.Fragment>
  );
};

export default NoPartyView;
