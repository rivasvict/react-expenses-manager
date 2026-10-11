import React, { useState } from "react";
import { Icon } from "@iconify/react";
import checkIcon from "@iconify-icons/codicon/check";
import { useTranslation } from "../../../i18n";
import {
  Currency,
  CURRENCY_SYMBOLS,
  getStoredCurrency,
  storeCurrency,
  SUPPORTED_CURRENCIES,
} from "../../../helpers/currency/currency";

/**
 * The display currency picker. The choice is stored on this device only
 * (never in the entries, backups or sync) and every screen formats amounts
 * with it from then on. Uses the same option rows as the language picker.
 */
const CurrencySection = () => {
  const { t } = useTranslation();
  const [currentCurrency, setCurrentCurrency] = useState<Currency>(
    getStoredCurrency
  );

  const pickCurrency = (currency: Currency) => {
    storeCurrency(currency);
    setCurrentCurrency(currency);
  };

  return (
    <fieldset>
      <legend className="settings-section__title">
        {t("settings.currency.title")}
      </legend>
      <p className="settings-section__description">
        {t("settings.currency.description")}
      </p>
      <div className="settings-options">
        {SUPPORTED_CURRENCIES.map((currency) => {
          const isSelected = currency === currentCurrency;
          return (
            <label
              key={currency}
              className={`settings-option${
                isSelected ? " settings-option--selected" : ""
              }`}
            >
              <input
                type="radio"
                name="currency"
                className="settings-option__input"
                value={currency}
                checked={isSelected}
                onChange={() => pickCurrency(currency)}
              />
              <span className="settings-option__text">
                <span className="settings-option__name">
                  {t(`currency.${currency}`)}
                </span>
                <span className="settings-option__hint">
                  {`${CURRENCY_SYMBOLS[currency]} · ${currency}`}
                </span>
              </span>
              {isSelected && (
                <span className="settings-option__check" aria-hidden="true">
                  <Icon icon={checkIcon} />
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default CurrencySection;
