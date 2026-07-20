import React from "react";
import { Icon } from "@iconify/react";
import filterIcon from "@iconify-icons/codicon/filter";
import closeIcon from "@iconify-icons/codicon/close";
import {
  EntryFilters,
  FilterDescriptor,
} from "../../../../helpers/entriesHelper/filterSortHelper";
import "./styles.scss";

type FilteredBannerProps = {
  descriptors: FilterDescriptor[];
  counts: { shown: number; total: number };
  /** "Filtered view" on the single lists; "Filtered view · both lists" on /summary. */
  title?: string;
  /** "Filtered total" on /expenses & /incomes; "Filtered total · net" on /summary. */
  totalLabel: string;
  /** Pre-formatted currency text. */
  totalValue: string;
  tone: "expense" | "income" | "net";
  onRemoveFilter: (key: keyof EntryFilters) => void;
  onClearAll: () => void;
};

/**
 * Gold banner that replaces the total tile while any filter is active: makes
 * the filtered state impossible to miss (funnel indicator, "N of M entries",
 * removable chips, filtered total, Clear). The count and the total sit in
 * aria-live="polite" regions so live filtering is announced.
 */
const FilteredBanner = ({
  descriptors,
  counts,
  title = "Filtered view",
  totalLabel,
  totalValue,
  tone,
  onRemoveFilter,
  onClearAll,
}: FilteredBannerProps) => (
  <div className="filtered-banner">
    <div className="filtered-banner__top">
      <span className="filtered-banner__indicator" aria-hidden="true">
        <Icon icon={filterIcon} />
      </span>
      <div className="filtered-banner__headline">
        <span className="filtered-banner__title">{title}</span>
        <span className="filtered-banner__count" aria-live="polite">
          {`${counts.shown} of ${counts.total} entries`}
        </span>
      </div>
      <button
        type="button"
        className="filtered-banner__clear"
        onClick={onClearAll}
      >
        <Icon icon={closeIcon} aria-hidden="true" />
        Clear
      </button>
    </div>
    <ul className="filtered-banner__chips">
      {descriptors.map((descriptor) => (
        <li key={descriptor.key} className="filtered-banner__chip">
          <span className="filtered-banner__chip-label">{descriptor.label}</span>
          <button
            type="button"
            className="filtered-banner__chip-remove"
            aria-label={`Remove filter ${descriptor.label}`}
            onClick={() => onRemoveFilter(descriptor.key)}
          >
            <Icon icon={closeIcon} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
    <div className="filtered-banner__total" aria-live="polite">
      <span className="filtered-banner__total-label">{totalLabel}</span>
      <span
        className={`filtered-banner__total-value filtered-banner__total-value--${tone}`}
      >
        {totalValue}
      </span>
    </div>
  </div>
);

export default FilteredBanner;
