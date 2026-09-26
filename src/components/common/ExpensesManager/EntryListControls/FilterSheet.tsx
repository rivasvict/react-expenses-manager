// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React, { useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/codicon/close";
import CategorySelector from "../CategorySelector";
import {
  EntryFilters,
  SearchScope,
  SortKey,
} from "../../../../helpers/entriesHelper/filterSortHelper";
import { TranslationKey, useTranslation } from "../../../../i18n";
import "./styles.scss";

type CategoryOption = { name: string; value: string };

type FilterSheetProps = {
  isOpen: boolean;
  /** Live count of currently visible entries, shown on the primary button. */
  resultCount: number;
  entryFilters: EntryFilters;
  categoryOptions: CategoryOption[];
  /** "expenses" | "incomes" | "entries" — feeds the category empty-option label. */
  name: "expenses" | "incomes" | "entries";
  onFiltersChange: (partialFilters: Partial<EntryFilters>) => void;
  onClearAll: () => void;
  onClose: () => void;
};

const SCOPE_OPTIONS: Array<{ value: SearchScope; labelKey: TranslationKey }> = [
  { value: "all", labelKey: "filterSheet.scopeAll" },
  { value: "description", labelKey: "filterSheet.scopeDescription" },
];

const SORT_OPTIONS: Array<{ value: SortKey; labelKey: TranslationKey }> = [
  { value: "date", labelKey: "sort.dateNewestFirst" },
  { value: "amount", labelKey: "sort.amountHighestFirst" },
  { value: "name", labelKey: "sort.nameAToZ" },
];

/**
 * "Filters & sort" sheet: a bottom sheet over a scrim on narrow screens, an
 * inline bordered panel on wide ones — same markup, the presentation switches
 * purely in SCSS at $nav-breakpoint. Filtering is live: the primary button
 * only shows the current result count and dismisses. Focus moves to the
 * heading on open; the caller returns it to the Filters button on close.
 */
const FilterSheet = ({
  isOpen,
  resultCount,
  entryFilters,
  categoryOptions,
  name,
  onFiltersChange,
  onClearAll,
  onClose,
}: FilterSheetProps) => {
  const { t, plural } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isOpen) headingRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // An inner control that already handled Escape (e.g. the category
    // combobox closing its own panel) prevents default — don't close the
    // whole sheet on top of it.
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="filter-sheet" onKeyDown={handleKeyDown}>
      <div
        className="filter-sheet__scrim"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="filter-sheet__panel"
        role="dialog"
        aria-labelledby="filter-sheet-heading"
      >
        <div className="filter-sheet__grabber" aria-hidden="true" />
        <div className="filter-sheet__header">
          <h2
            id="filter-sheet-heading"
            className="filter-sheet__heading"
            tabIndex={-1}
            ref={headingRef}
          >
            {t("filterSheet.heading")}
          </h2>
          <button
            type="button"
            className="filter-sheet__close"
            aria-label={t("filterSheet.close")}
            onClick={onClose}
          >
            <Icon icon={closeIcon} aria-hidden="true" />
          </button>
        </div>

        <div className="filter-sheet__body">
          <div className="filter-sheet__field">
            <label className="form-label" htmlFor="filter-sheet-search">
              {t("filterSheet.search")}
            </label>
            <input
              id="filter-sheet-search"
              type="text"
              className="filter-sheet__search-input"
              placeholder={t("toolbar.searchEntries")}
              value={entryFilters.search}
              onChange={(event) =>
                onFiltersChange({ search: event.currentTarget.value })
              }
            />
          </div>

          <fieldset className="filter-sheet__field filter-sheet__fieldset">
            <legend className="form-label">{t("filterSheet.searchIn")}</legend>
            <div className="filter-sheet__segments">
              {SCOPE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`filter-sheet__segment${
                    entryFilters.searchScope === option.value
                      ? " filter-sheet__segment--selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="search-scope"
                    className="filter-sheet__segment-input"
                    value={option.value}
                    checked={entryFilters.searchScope === option.value}
                    onChange={() =>
                      onFiltersChange({ searchScope: option.value })
                    }
                  />
                  {t(option.labelKey)}
                </label>
              ))}
            </div>
            <p className="filter-sheet__hint">{t("filterSheet.scopeHint")}</p>
          </fieldset>

          <div className="filter-sheet__field">
            <label
              className="form-label"
              htmlFor="sheet-category-filter"
              id="sheet-category-filter-label"
            >
              {t("filterSheet.filterByCategory")}
            </label>
            <CategorySelector
              id="sheet-category-filter"
              name={name}
              value={entryFilters.category}
              handleChange={(event: {
                currentTarget: { value: string };
              }) => onFiltersChange({ category: event.currentTarget.value })}
              categoryOptions={categoryOptions}
              emptyOptionLabel={t(`filterSheet.all.${name}`)}
              className="filter-sheet__category-select"
            />
          </div>

          <fieldset className="filter-sheet__field filter-sheet__fieldset">
            <legend className="form-label">
              {t("sort.sortBy")}
              <span className="filter-sheet__legend-note">
                {t("filterSheet.sameAsToolbar")}
              </span>
            </legend>
            <div className="filter-sheet__sort-options">
              {SORT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`filter-sheet__sort-option${
                    entryFilters.sortKey === option.value
                      ? " filter-sheet__sort-option--selected"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="sheet-sort-key"
                    className="filter-sheet__sort-input"
                    value={option.value}
                    checked={entryFilters.sortKey === option.value}
                    onChange={() => onFiltersChange({ sortKey: option.value })}
                  />
                  {t(option.labelKey)}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="filter-sheet__actions">
          <button
            type="button"
            className="btn btn-secondary filter-sheet__clear-all"
            onClick={onClearAll}
          >
            {t("filterSheet.clearAll")}
          </button>
          <button
            type="button"
            className="btn btn-primary filter-sheet__show-results"
            onClick={onClose}
          >
            {plural("filterSheet.showResults", resultCount)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSheet;
