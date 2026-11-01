import React, { useRef } from "react";
import { useTranslation } from "../../../i18n";
import type { Currency } from "../../../helpers/currency/currency";
import type { Theme } from "../../../themes";
import ThemeCard from "../ThemeCard";

interface ThemeRadioGroupProps {
  themes: Theme[];
  currentId: string;
  onPick: (id: string) => void;
  currency?: Currency;
  /** Lays the cards out: a grid in the Settings sheet, a strip in setup. */
  className: string;
}

const STEP_BY_KEY: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * The themes as one `radiogroup` labelled "Theme". Only the checked card is in
 * the tab order; the arrow keys (and Home / End) move to another card and pick
 * it, as native radios do.
 */
const ThemeRadioGroup = ({
  themes,
  currentId,
  onPick,
  currency,
  className,
}: ThemeRadioGroupProps) => {
  const { t } = useTranslation();
  const cards = useRef<Array<HTMLButtonElement | null>>([]);

  const moveTo = (index: number) => {
    const wrapped = (index + themes.length) % themes.length;
    cards.current[wrapped]?.focus();
    onPick(themes[wrapped].id);
  };
  const handleKeyDown =
    (index: number) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key in STEP_BY_KEY) {
        event.preventDefault();
        moveTo(index + STEP_BY_KEY[event.key]);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        moveTo(event.key === "Home" ? 0 : themes.length - 1);
      }
    };

  return (
    <div
      className={className}
      role="radiogroup"
      aria-label={t("settings.theme.title")}
    >
      {themes.map((theme, index) => (
        <ThemeCard
          key={theme.id}
          ref={(node) => {
            cards.current[index] = node;
          }}
          theme={theme}
          currency={currency}
          selected={theme.id === currentId}
          tabIndex={theme.id === currentId ? 0 : -1}
          onSelect={() => onPick(theme.id)}
          onKeyDown={handleKeyDown(index)}
        />
      ))}
    </div>
  );
};

export default ThemeRadioGroup;
