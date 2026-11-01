import React, { forwardRef, useId } from "react";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/codicon/check";
import { useTranslation } from "../../../i18n";
import type { Currency } from "../../../helpers/currency/currency";
import type { Theme } from "../../../themes";
import ThemePreview from "../ThemePreview";
import "./styles.scss";

interface ThemeCardProps {
  theme: Theme;
  selected: boolean;
  onSelect: () => void;
  /** The currency of the preview's sample figures. */
  currency?: Currency;
  /** Roving tabindex: only one radio of a group is in the tab order. */
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * One theme in a picker: a live miniature, the theme's name and what it is
 * inspired by (or "The original look" for the default). It is a radio whose
 * accessible name is the theme's name; the second line describes it.
 */
const ThemeCard = forwardRef<HTMLButtonElement, ThemeCardProps>(
  ({ theme, selected, onSelect, currency, tabIndex, onKeyDown }, ref) => {
    const { t, language } = useTranslation();
    const descriptionId = useId();

    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={theme.name}
        aria-describedby={descriptionId}
        className={`theme-card${selected ? " theme-card--selected" : ""}`}
        tabIndex={tabIndex}
        ref={ref}
        onClick={onSelect}
        onKeyDown={onKeyDown}
      >
        <ThemePreview theme={theme} currency={currency} />
        <span className="theme-card__text">
          <span className="theme-card__name">
            {theme.name}
            {theme.default && (
              <span className="theme-card__badge">{t("themes.default")}</span>
            )}
          </span>
          <span className="theme-card__source" id={descriptionId}>
            {theme.default
              ? t("themes.original")
              : t("themes.inspiredBy", {
                  source: theme.inspiration[language],
                })}
          </span>
        </span>
        {selected && (
          <span
            className="theme-card__tick"
            data-testid="theme-card-tick"
            aria-hidden="true"
          >
            <Icon icon={checkIcon} />
          </span>
        )}
      </button>
    );
  },
);

export default ThemeCard;
