import React from "react";
import { useTranslation } from "../../../i18n";
import { Currency, formatCurrency } from "../../../helpers/currency/currency";
import type { Theme } from "../../../themes";
import "./styles.scss";

interface ThemePreviewProps {
  theme: Theme;
  /** The currency of the sample figures; the stored one when omitted. */
  currency?: Currency;
}

/**
 * A miniature of the app drawn in one theme, whatever theme the app is in
 * (`data-theme` scopes the theme's variables to this element). The figures are
 * fixed samples, an illustration and not the user's data, so Privacy mode
 * does not hide them.
 */
const ThemePreview = ({ theme, currency }: ThemePreviewProps) => {
  const { t } = useTranslation();

  return (
    <span
      className="theme-preview"
      data-testid="theme-preview"
      data-theme={theme.id}
      aria-hidden="true"
    >
      <span className="theme-preview__top">
        <span className="theme-preview__logo" />
        <span className="theme-preview__brand" />
      </span>
      <span className="theme-preview__surface">
        <span className="theme-preview__hero">
          <span className="theme-preview__label">{t("common.savings")}</span>
          <span className="theme-preview__figure">
            {formatCurrency(1620, currency)}
          </span>
        </span>
        <span className="theme-preview__row">
          <span className="theme-preview__chip theme-preview__chip--in" />
          <span className="theme-preview__name" />
          <span className="theme-preview__in">
            {formatCurrency(4200, currency)}
          </span>
        </span>
        <span className="theme-preview__row">
          <span className="theme-preview__chip theme-preview__chip--out" />
          <span className="theme-preview__name" />
          <span className="theme-preview__out">
            {formatCurrency(2580, currency)}
          </span>
        </span>
        <span className="theme-preview__buttons">
          <span className="theme-preview__button" />
          <span className="theme-preview__button theme-preview__button--ghost" />
        </span>
      </span>
    </span>
  );
};

export default ThemePreview;
