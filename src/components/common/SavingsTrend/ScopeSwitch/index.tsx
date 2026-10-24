import React, { useEffect, useRef } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "../../../../i18n";
import "./styles.scss";

export type TrendScope = "savings" | "categories";

export const SCOPE_ROUTES: Record<TrendScope, string> = {
  savings: "/savings-trend",
  categories: "/category-trends",
};

const SCOPES: TrendScope[] = ["savings", "categories"];

/** Router state that asks the switch to take focus once its view opens. */
interface ScopeSwitchLocationState {
  focusScope?: boolean;
}

const ICONS: Record<TrendScope, string> = {
  savings: "M1.5 12 6 7.5l3 3 5.5-6M10.5 4.5h4v4",
  categories:
    "M2.5 2.5h4.5v4.5h-4.5zM9 2.5h4.5v4.5h-4.5zM2.5 9h4.5v4.5h-4.5zM9 9h4.5v4.5h-4.5z",
};

interface ScopeSwitchProps {
  active: TrendScope;
}

/**
 * The Savings | Categories switch at the top of the trend screens, in place of
 * the eyebrow (design/features/category-trends/ui/approved/). Each segment
 * opens its view; arrow keys, Home and End move between them. Each view is a
 * screen of its own, so a switch made from the keyboard asks the next view's
 * switch to take focus back.
 */
const ScopeSwitch = ({ active }: ScopeSwitchProps) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation<ScopeSwitchLocationState | undefined>();
  const tabRefs = useRef<Partial<Record<TrendScope, HTMLButtonElement | null>>>({});

  useEffect(
    () => {
      if (location.state?.focusScope) tabRefs.current[active]?.focus();
    },
    // Only when the view opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const open = (scope: TrendScope, fromKeyboard = false) => {
    // Tapping the open view again adds no history entry.
    if (location.pathname === SCOPE_ROUTES[scope]) return;
    history.push(SCOPE_ROUTES[scope], fromKeyboard ? { focusScope: true } : undefined);
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const target =
      event.key === "ArrowRight" || event.key === "End" ? "categories"
      : event.key === "ArrowLeft" || event.key === "Home" ? "savings"
      : null;
    if (!target) return;
    event.preventDefault();
    tabRefs.current[target]?.focus();
    if (target !== active) open(target, true);
  };

  return (
    <div
      className="scope-switch"
      role="tablist"
      aria-label={t("categoryTrends.scope.group")}
      onKeyDown={handleKeyDown}
    >
      {SCOPES.map((scope) => (
        <button
          key={scope}
          type="button"
          role="tab"
          aria-selected={scope === active}
          tabIndex={scope === active ? 0 : -1}
          ref={(node) => {
            tabRefs.current[scope] = node;
          }}
          className={`scope-switch__item${scope === active ? " scope-switch__item--on" : ""}`}
          onClick={() => open(scope)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d={ICONS[scope]} />
          </svg>
          {t(`categoryTrends.scope.${scope}`)}
        </button>
      ))}
    </div>
  );
};

export default ScopeSwitch;
