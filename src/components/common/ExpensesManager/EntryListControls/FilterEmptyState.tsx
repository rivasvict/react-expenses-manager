import React from "react";
import { Icon } from "@iconify/react";
import searchIcon from "@iconify-icons/codicon/search";
import "./styles.scss";

type FilterEmptyStateProps = {
  onClearAll: () => void;
};

/** Dashed-border card shown when the active filters match zero entries. */
const FilterEmptyState = ({ onClearAll }: FilterEmptyStateProps) => (
  <div className="filter-empty-state">
    <span className="filter-empty-state__icon" aria-hidden="true">
      <Icon icon={searchIcon} />
    </span>
    <p className="filter-empty-state__title">No entries match your filters</p>
    <p className="filter-empty-state__hint">
      Try a different search term or a broader category.
    </p>
    <button
      type="button"
      className="btn btn-secondary filter-empty-state__clear"
      onClick={onClearAll}
    >
      Clear all filters
    </button>
  </div>
);

export default FilterEmptyState;
