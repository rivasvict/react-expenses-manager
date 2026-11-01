import React from "react";
import { Icon } from "@iconify/react";
import eyeIcon from "@iconify-icons/codicon/eye";
import eyeClosedIcon from "@iconify-icons/codicon/eye-closed";
import { useTranslation } from "../../../i18n";
import { usePrivacy } from "../../../privacy";
import "./styles.scss";

/**
 * The eye in the top-right corner of the dashboard's Savings tile: shows the hidden figures, or
 * hides them again. It renders nothing while Privacy mode is off. It overlays
 * the savings tile instead of sitting in it because that tile is a link and a
 * button cannot live inside a link (design/features/privacy-mode/ui/approved/).
 */
const PrivacyEye = () => {
  const { t } = useTranslation();
  const { enabled, hidden, reveal, hide } = usePrivacy();
  if (!enabled) return null;
  return (
    <div className="privacy-eye">
      <button
        type="button"
        className={`privacy-eye__button${
          hidden ? " privacy-eye__button--hidden" : ""
        }`}
        aria-label={hidden ? t("privacy.show") : t("privacy.hide")}
        onClick={hidden ? reveal : hide}
      >
        <Icon icon={hidden ? eyeClosedIcon : eyeIcon} aria-hidden="true" />
      </button>
    </div>
  );
};

export default PrivacyEye;
