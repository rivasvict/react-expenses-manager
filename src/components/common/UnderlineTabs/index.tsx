import React, { useRef } from "react";
import "./styles.scss";

export interface UnderlineTab<Id extends string> {
  id: Id;
  label: string;
  /** Shown after the label, inside the tab (e.g. a count). */
  badge?: React.ReactNode;
}

interface UnderlineTabsProps<Id extends string> {
  tabs: UnderlineTab<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * A row of tabs with a gold underline under the selected one. Arrow keys,
 * Home and End move between them (the ARIA tabs pattern with automatic
 * activation).
 */
const UnderlineTabs = <Id extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  className = "",
}: UnderlineTabsProps<Id>) => {
  const tabRefs = useRef<Partial<Record<Id, HTMLButtonElement | null>>>({});
  const ids = tabs.map((tab) => tab.id);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const index = ids.indexOf(active);
    const target =
      event.key === "ArrowRight" ? ids[Math.min(index + 1, ids.length - 1)]
      : event.key === "ArrowLeft" ? ids[Math.max(index - 1, 0)]
      : event.key === "Home" ? ids[0]
      : event.key === "End" ? ids[ids.length - 1]
      : null;
    if (!target) return;
    event.preventDefault();
    onChange(target);
    tabRefs.current[target]?.focus();
  };

  return (
    <div
      className={`underline-tabs ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {tabs.map(({ id, label, badge }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={id === active}
          tabIndex={id === active ? 0 : -1}
          ref={(node) => {
            tabRefs.current[id] = node;
          }}
          className={`underline-tabs__tab${id === active ? " underline-tabs__tab--on" : ""}`}
          onClick={() => onChange(id)}
        >
          {label}
          {badge !== undefined && (
            <span className="underline-tabs__badge">{badge}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default UnderlineTabs;
