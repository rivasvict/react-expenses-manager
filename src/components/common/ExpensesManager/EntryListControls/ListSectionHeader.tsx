import React from "react";
import "./styles.scss";

type ListSectionHeaderProps = {
  /** "Expenses" / "Incomes", or "Matching expenses" / ... while filtered. */
  label: string;
  count?: number;
  /** Pre-formatted per-list money total — shown instead of the count on /summary. */
  totalText?: string;
  tone: "expense" | "income";
};

/**
 * Uppercase tinted label above the entry rows + right-aligned detail: the
 * entry count on the single lists, the per-list money total on /summary.
 */
const ListSectionHeader = ({
  label,
  count,
  totalText,
  tone,
}: ListSectionHeaderProps) => (
  <div className={`list-section-header list-section-header--${tone}`}>
    <span className="list-section-header__label">{label}</span>
    <span className="list-section-header__count">
      {totalText !== undefined
        ? totalText
        : `${count} ${count === 1 ? "entry" : "entries"}`}
    </span>
  </div>
);

export default ListSectionHeader;
