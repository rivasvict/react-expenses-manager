import React from "react";
import { useTranslation } from "../../../i18n";
import {
  Currency,
  CURRENCY_SYMBOLS,
  SUPPORTED_CURRENCIES,
} from "../../../helpers/currency/currency";
import "./styles.scss";

interface CurrencyTileGridProps {
  current: Currency;
  onPick: (currency: Currency) => void;
  /** Tiles per row: 3 in the Settings sheet, 4 in the onboarding wizard. */
  columns?: 3 | 4;
}

/**
 * The currency radios as a grid of symbol + code tiles, the current one
 * marked. Each tile's accessible name is the full currency name. It only
 * reports the pick: the caller decides what it applies and whether to close.
 */
const CurrencyTileGrid = ({
  current,
  onPick,
  columns = 3,
}: CurrencyTileGridProps) => {
  const { t } = useTranslation();

  return (
    <div className={`currency-tile-grid currency-tile-grid--${columns}`}>
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
            onChange={() => onPick(currency)}
          />
          <span className="currency-tile__symbol">
            {CURRENCY_SYMBOLS[currency]}
          </span>
          <span className="currency-tile__code">{currency}</span>
        </label>
      ))}
    </div>
  );
};

export default CurrencyTileGrid;
