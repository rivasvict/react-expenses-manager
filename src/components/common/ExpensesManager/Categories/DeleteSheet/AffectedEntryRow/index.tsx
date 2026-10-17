import React from "react";
import TypeChip from "../../TypeChip";
import { AffectedEntry } from "../../../../../../helpers/categoryChanges/categoryChanges";
import { formatCurrency } from "../../../../../../helpers/currency/currency";
import { formatShortDate } from "../../../../../../helpers/shortDate/shortDate";
import { useTranslation } from "../../../../../../i18n";
import "./styles.scss";

interface AffectedEntryRowProps {
  entry: AffectedEntry;
  /** The categories it can move to. */
  options: string[];
  /** The category picked for it; "" while none is. */
  value: string;
  onChange: (category: string) => void;
}

/**
 * One entry of a category being deleted: its chip, description, date and
 * amount, and a native select for the category it moves to.
 */
const AffectedEntryRow = ({
  entry,
  options,
  value,
  onChange,
}: AffectedEntryRowProps) => {
  const { t, language } = useTranslation();
  const amount = formatCurrency(Number(entry.amount) || 0);
  return (
    <div className="affected-entry">
      <TypeChip type={entry.type} />
      <span className="affected-entry__main">
        <span className="affected-entry__description">
          {entry.description || amount}
        </span>
        <span className="affected-entry__meta">
          {entry.date !== undefined && (
            <>
              {formatShortDate(entry.date, language)}
              {" · "}
            </>
          )}
          <span className={`affected-entry__amount--${entry.type}`}>
            {amount}
          </span>
        </span>
      </span>
      <select
        className={`affected-entry__select${value ? "" : " affected-entry__select--empty"}`}
        aria-label={t("deleteSheet.rowLabel", {
          description: entry.description || amount,
        })}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="">{t("deleteSheet.choose")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AffectedEntryRow;
