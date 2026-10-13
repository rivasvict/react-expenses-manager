import React from "react";
import { Icon } from "@iconify/react";
import eyeIcon from "@iconify-icons/codicon/eye";
import eyeClosedIcon from "@iconify-icons/codicon/eye-closed";
import { useTranslation } from "../../../i18n";
import { usePrivacy } from "../../../privacy";
import "./styles.scss";

interface PrivacyEyeProps {
  /**
   * The text the eye sits after. An invisible copy of it pushes the eye to the
   * right place, so it follows the label in every language.
   */
  after: string;
}

/**
 * The eye beside the dashboard's "Savings" label: shows the hidden figures, or
 * hides them again. It renders nothing while Privacy mode is off. It overlays
 * the savings tile instead of sitting in it because that tile is a link and a
 * button cannot live inside a link (design/features/privacy-mode/ui/approved/).
 */
const PrivacyEye = ({ after }: PrivacyEyeProps) => {
  const { t } = useTranslation();
  const { enabled, hidden, reveal, hide } = usePrivacy();
  if (!enabled) return null;
  return (
    <div className="privacy-eye">
      <span className="privacy-eye__spacer" aria-hidden="true">
        {after}
      </span>
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
