import React from "react";
import "./styles.scss";

type ListSectionHeaderProps = {
  /** "Expenses" / "Incomes", or "Matching expenses" / ... while filtered. */
  label: string;
  count: number;
  tone: "expense" | "income";
};

/** Uppercase tinted label above the entry rows + right-aligned entry count. */
const ListSectionHeader = ({ label, count, tone }: ListSectionHeaderProps) => (
  <div className={`list-section-header list-section-header--${tone}`}>
    <span className="list-section-header__label">{label}</span>
    <span className="list-section-header__count">
      {`${count} ${count === 1 ? "entry" : "entries"}`}
    </span>
  </div>
);

export default ListSectionHeader;
