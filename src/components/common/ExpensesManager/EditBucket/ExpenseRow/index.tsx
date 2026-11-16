import React from "react";
import TypeChip from "../../Categories/TypeChip";
import { formatNumberForDisplay } from "../../../../../helpers/entriesHelper/entriesHelper";
import { formatDayMonth } from "../../../../../helpers/shortDate/shortDate";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

// A true minus (U+2212): it reads as a sign next to an amount, not a hyphen.
const MINUS = "−";

interface ExpenseRowProps {
  title: string;
  date: number;
  amount: number;
}

/** One expense: type chip, its description over the date, and the amount out. */
const ExpenseRow = ({ title, date, amount }: ExpenseRowProps) => {
  const { language } = useTranslation();

  return (
    <li className="expense-row">
      <TypeChip type="expense" />
      <div className="expense-row__body">
        <p className="expense-row__title">{title}</p>
        <p className="expense-row__date">{formatDayMonth(date, language)}</p>
      </div>
      <span className="expense-row__amount">
        {MINUS}
        {formatNumberForDisplay(amount)}
      </span>
    </li>
  );
};

export default ExpenseRow;
