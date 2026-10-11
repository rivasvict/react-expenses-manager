import React from "react";
import BottomSheet from "../../common/BottomSheet";
import { useTranslation } from "../../../i18n";
import {
  Currency,
  CURRENCY_SYMBOLS,
  SUPPORTED_CURRENCIES,
} from "../../../helpers/currency/currency";
import "./styles.scss";

interface CurrencySheetProps {
  current: Currency;
  onPick: (currency: Currency) => void;
  onClose: () => void;
}

/**
 * The display currency picker: a grid of symbol + code tiles, the current one
 * marked. Each tile's accessible name is the full currency name. Picking one
 * applies it at once, then closes the sheet.
 */
const CurrencySheet = ({ current, onPick, onClose }: CurrencySheetProps) => {
  const { t } = useTranslation();

  return (
    <BottomSheet
      title={t("settings.currency.title")}
      closeLabel={t("settings.sheet.close")}
      onClose={onClose}
    >
      <fieldset className="currency-sheet">
        <legend className="field-hint">
          {t("settings.currency.description")}
        </legend>
        <div className="currency-sheet__grid">
          {SUPPORTED_CURRENCIES.map((currency) => (
            <label
              key={currency}
              className={`currency-tile${
                currency === current ? " currency-tile--selected" : ""
              }`}
            >
              <input
                type="radio"
                name="currency"
                className="currency-tile__input"
                value={currency}
                aria-label={t(`currency.${currency}`)}
                checked={currency === current}
                onChange={() => {
                  onPick(currency);
                  onClose();
                }}
              />
              <span className="currency-tile__symbol">
                {CURRENCY_SYMBOLS[currency]}
              </span>
              <span className="currency-tile__code">{currency}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </BottomSheet>
  );
};

export default CurrencySheet;
