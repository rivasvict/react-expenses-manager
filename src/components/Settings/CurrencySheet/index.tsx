import React from "react";
import BottomSheet from "../../common/BottomSheet";
import { useTranslation } from "../../../i18n";
import { Currency } from "../../../helpers/currency/currency";
import CurrencyTileGrid from "../CurrencyTileGrid";
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
        <CurrencyTileGrid
          current={current}
          onPick={(currency) => {
            onPick(currency);
            onClose();
          }}
        />
      </fieldset>
    </BottomSheet>
  );
};

export default CurrencySheet;
