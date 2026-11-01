import React from "react";
import { Icon } from "@iconify/react";
import eyeClosedIcon from "@iconify-icons/codicon/eye-closed";
import { useTranslation } from "../../../i18n";
import { usePrivacy } from "../../../privacy";
import "./styles.scss";

/**
 * Stands in for the dashboard's savings doughnut while Privacy mode hides it:
 * one full-width button that shows the figures, the same action as the eye on
 * the Savings tile (design/features/privacy-mode-polish/ui/approved/).
 */
const ShowFiguresButton = () => {
  const { t } = useTranslation();
  const { reveal } = usePrivacy();
  return (
    <button type="button" className="show-figures-button" onClick={reveal}>
      <Icon icon={eyeClosedIcon} aria-hidden="true" />
      {t("privacy.show")}
    </button>
  );
};

export default ShowFiguresButton;
