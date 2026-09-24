import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import settingsGearIcon from "@iconify-icons/codicon/settings-gear";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

/**
 * Settings entry point in the app bar: a circular icon-button that sits with
 * the account chip, so device-level preferences (such as the UI language)
 * live beside "your session" rather than among the money destinations in the
 * main nav.
 */
const SettingsChip = () => {
  const { t } = useTranslation();
  return (
    <Link
      to="/settings"
      className="settings-chip"
      aria-label={t("settings.title")}
      title={t("settings.title")}
    >
      <Icon
        icon={settingsGearIcon}
        className="settings-chip__icon"
        aria-hidden="true"
      />
    </Link>
  );
};

export default SettingsChip;
