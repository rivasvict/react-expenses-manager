import React from "react";
import { useTranslation } from "../../../../i18n";
import { formatSavings } from "../../../../helpers/savingsTrend/formatters";
import type { TotalSaved } from "../../../../helpers/savingsTrend/savingsTotal";

interface TotalFiguresProps extends TotalSaved {
  /** "Total saved, Apr – Oct". */
  label: string;
}

/**
 * The Total saved tab's figures, inside the headline card: what the whole
 * range put aside, the months it spans and the monthly average.
 */
const TotalFigures = ({ label, total, months, average }: TotalFiguresProps) => {
  const { t, plural } = useTranslation();
  const tone = total < 0 ? "down" : "neutral";
  return (
    <>
      <span className="trend-summary__label">{label}</span>
      <span className={`trend-summary__amount trend-summary__amount--${tone}`}>
        {formatSavings(total)}
      </span>
      <span className="trend-summary__delta">
        <span className="trend-summary__caption">
          {plural("savingsTrend.total.months", months)} {"·"}{" "}
          {t("savingsTrend.total.average", { amount: formatSavings(average) })}
        </span>
      </span>
    </>
  );
};

export default TotalFigures;
