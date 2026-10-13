import React from "react";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

/**
 * Stands in for the dashboard's savings doughnut while Privacy mode hides it:
 * one uniform ring, so the split between expenses and savings is not visible,
 * and the legend with neutral dots. The real chart is not rendered at all
 * (design/features/privacy-mode/ui/approved/).
 */
const HiddenBalanceChart = () => {
  const { t } = useTranslation();
  return (
    <div className="hidden-balance-chart">
      <div
        className="hidden-balance-chart__ring"
        role="img"
        aria-label={t("privacy.chartHidden")}
      />
      <ul className="hidden-balance-chart__legend">
        <li>{t("common.expenses")}</li>
        <li>{t("common.savings")}</li>
      </ul>
    </div>
  );
};

export default HiddenBalanceChart;
