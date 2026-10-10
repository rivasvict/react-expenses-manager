import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import chevronRight from "@iconify-icons/codicon/chevron-right";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

interface SavingsTrendLinkProps {
  to: string;
}

/**
 * The gold "Trend ›" link in the dashboard savings card's footer, led by a
 * small trending-up chip. It opens the Savings trend screen.
 */
const SavingsTrendLink = ({ to }: SavingsTrendLinkProps) => {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className="savings-trend-link"
      aria-label={t("savingsTrend.linkLabel")}
    >
      <span className="savings-trend-link__chip" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path d="M1.5 12 6 7.5l3 3 5.5-6M10.5 4.5h4v4" />
        </svg>
      </span>
      {t("savingsTrend.link")}
      <Icon
        icon={chevronRight}
        className="savings-trend-link__chevron"
        aria-hidden="true"
      />
    </Link>
  );
};

export default SavingsTrendLink;
