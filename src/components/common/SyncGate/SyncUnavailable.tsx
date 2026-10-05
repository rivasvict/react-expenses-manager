import React from "react";
import { MainContentContainer } from "../MainContentContainer";
import ButtonLikeLink from "../ButtonLikeLink";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

/**
 * Stands in for a sync screen reached while the sync server cannot be used
 * (an old bookmark, or the server dropping while the user is on it). It
 * replaces the page rather than redirecting, so the URL stays and reloading
 * once the server answers brings the real screen back.
 */
const SyncUnavailable = () => {
  const { t } = useTranslation();
  return (
    <MainContentContainer className="sync-unavailable">
      <div className="sync-unavailable__tile">{t("syncUnavailable.title")}</div>
      <p className="sync-unavailable__message">
        {t("syncUnavailable.message")}
      </p>
      <ButtonLikeLink
        className="btn-primary"
        to="/"
        buttonTitle={t("syncUnavailable.goToDashboard")}
      />
    </MainContentContainer>
  );
};

export default SyncUnavailable;
