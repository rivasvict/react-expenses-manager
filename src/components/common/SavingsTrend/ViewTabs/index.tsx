import React, { useRef } from "react";
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
  const tabRefs = useRef<Record<TrendView, HTMLButtonElement | null>>({
    total: null,
    change: null,
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const index = VIEWS.indexOf(active);
    const target =
      event.key === "ArrowRight" ? VIEWS[Math.min(index + 1, VIEWS.length - 1)]
      : event.key === "ArrowLeft" ? VIEWS[Math.max(index - 1, 0)]
      : event.key === "Home" ? VIEWS[0]
      : event.key === "End" ? VIEWS[VIEWS.length - 1]
      : null;
    if (!target) return;
    event.preventDefault();
    onChange(target);
    tabRefs.current[target]?.focus();
  };

  return (
    <div
      className="view-tabs"
      role="tablist"
      aria-label={t("savingsTrend.view.group")}
      onKeyDown={handleKeyDown}
    >
      {VIEWS.map((view) => (
        <button
          key={view}
          type="button"
          role="tab"
          aria-selected={view === active}
          tabIndex={view === active ? 0 : -1}
          ref={(node) => {
            tabRefs.current[view] = node;
          }}
          className={`view-tabs__tab${view === active ? " view-tabs__tab--on" : ""}`}
          onClick={() => onChange(view)}
        >
          {t(`savingsTrend.view.${view}`)}
        </button>
      ))}
    </div>
  );
};

export default ViewTabs;
