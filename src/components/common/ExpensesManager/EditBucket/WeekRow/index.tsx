import React from "react";
import { BucketExpense } from "../../../../../helpers/bucketPace/bucketPace";
import { formatNumberForDisplay } from "../../../../../helpers/entriesHelper/entriesHelper";
import { useTranslation } from "../../../../../i18n";
import ExpenseRow from "../ExpenseRow";
import "./styles.scss";

interface WeekRowProps {
  /** "Oct 26 – 28", spelled for the language. */
  label: string;
  spent: number;
  pace: number | null;
  /** The bar's full width, shared by every week so the bars compare. */
  scale: number;
  expenses: BucketExpense[];
  /** Shown when an expense has no description. */
  fallbackTitle: string;
  /** Week rows draw the bar and the pace mark; the chart views leave them to the chart. */
  showBar?: boolean;
}

/**
 * One week of a bucket: its label with "spent of pace", a thin bar with the
 * pace tick, and the card of that week's expenses.
 */
const WeekRow = ({ label, spent, pace, scale, expenses, fallbackTitle, showBar = true }: WeekRowProps) => {
  const { t } = useTranslation();
  const overPace = pace !== null && spent > pace;

  return (
    <li className={`week-row${showBar ? "" : " week-row--plain"}`} data-testid="week-row">
      <div className="week-row__top">
        <h3 className="week-row__label">{label}</h3>
        <span>
          <strong data-testid="week-row-spent">{formatNumberForDisplay(spent)}</strong>
          {showBar && pace !== null && (
            <span className="week-row__pace" data-testid="week-row-pace">
              {" "}
              {t("editBucket.weekOf", { amount: formatNumberForDisplay(pace) })}
            </span>
          )}
        </span>
      </div>
      {showBar && (
      <div className="week-row__bar" aria-hidden="true">
        <i
          className={overPace ? "ahead" : ""}
          style={{ width: `${Math.min(spent / scale, 1) * 100}%` }}
        />
        {pace !== null && (
          <span className="week-row__tick" style={{ left: `${(pace / scale) * 100}%` }} />
        )}
      </div>
      )}
      <ul className="week-row__list">
        {expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            title={expense.description || fallbackTitle}
            date={expense.date}
            amount={parseFloat(String(expense.amount))}
          />
        ))}
      </ul>
    </li>
  );
};

export default WeekRow;
