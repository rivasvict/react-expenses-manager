import React from "react";
import UnderlineTabs from "../../UnderlineTabs";
import { useTranslation } from "../../../../i18n";
import "./styles.scss";

export type TrendView = "total" | "change";

const VIEWS: TrendView[] = ["total", "change"];

interface ViewTabsProps {
  active: TrendView;
  onChange: (view: TrendView) => void;
}

/**
 * The two tabs on top of the headline card: Total saved (left) and Change
 * (right). Arrow keys, Home and End move between them.
 */
const ViewTabs = ({ active, onChange }: ViewTabsProps) => {
  const { t } = useTranslation();
  return (
    <UnderlineTabs
      className="view-tabs"
      ariaLabel={t("savingsTrend.view.group")}
      tabs={VIEWS.map((view) => ({
        id: view,
        label: t(`savingsTrend.view.${view}`),
      }))}
      active={active}
      onChange={onChange}
    />
  );
};

export default ViewTabs;
