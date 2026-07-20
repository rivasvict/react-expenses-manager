import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import searchIcon from "@iconify-icons/codicon/search";
import checkIcon from "@iconify-icons/codicon/check";
import filterIcon from "@iconify-icons/codicon/filter";
import { EntryFilters, SortKey } from "../../../../helpers/entriesHelper/filterSortHelper";
import "./styles.scss";

type EntryListToolbarProps = {
  entryFilters: EntryFilters;
  /** Active filters beyond search — shown as the gold badge on Filters. */
  activeFilterCount: number;
  /** Whether the filter sheet/panel is open (engaged Filters styling). */
  isFilterSheetOpen: boolean;
  onFiltersChange: (partialFilters: Partial<EntryFilters>) => void;
  onOpenFilters: () => void;
  /** Owned by the screen so focus can return here when the sheet closes. */
  filtersButtonRef: React.RefObject<HTMLButtonElement>;
};

type SortOption = {
  key: SortKey;
  /** Bolded current-key label on the collapsed button ("Sort: Date"). */
  buttonLabel: string;
  /** Full option wording inside the popover menu. */
  menuLabel: string;
  subtitle?: string;
  isDefault?: boolean;
};

const SORT_OPTIONS: SortOption[] = [
  {
    key: "date",
    buttonLabel: "Date",
    menuLabel: "Date — newest first",
    isDefault: true,
  },
  { key: "amount", buttonLabel: "Amount", menuLabel: "Amount — highest first" },
  {
    key: "name",
    buttonLabel: "Name",
    menuLabel: "Name — A → Z",
    subtitle: "then by description",
  },
];

/**
 * Collapsed filter/sort toolbar for the entry lists: a slim live-search field
 * plus a "Sort: <key>" button opening a single-select popover menu (arrow
 * keys to move, Enter to pick, Esc to dismiss). Presentational only — the
 * shared filter state lives in Redux and arrives via props, so the toolbar
 * and the (upcoming) filter sheet can never diverge.
 */
const EntryListToolbar = ({
  entryFilters,
  activeFilterCount,
  isFilterSheetOpen,
  onFiltersChange,
  onOpenFilters,
  filtersButtonRef,
}: EntryListToolbarProps) => {
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const sortRootRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedOption =
    SORT_OPTIONS.find((option) => option.key === entryFilters.sortKey) ||
    SORT_OPTIONS[0];

  const closeSortMenu = (shouldRefocusButton = true) => {
    setIsSortMenuOpen(false);
    if (shouldRefocusButton) sortButtonRef.current?.focus();
  };

  // Focus lands on the currently selected option as soon as the menu opens.
  useEffect(() => {
    if (!isSortMenuOpen) return;
    const selectedIndex = SORT_OPTIONS.findIndex(
      (option) => option.key === entryFilters.sortKey
    );
    optionRefs.current[selectedIndex >= 0 ? selectedIndex : 0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSortMenuOpen]);

  // Click-outside closes the menu; attached only while open.
  useEffect(() => {
    if (!isSortMenuOpen) return undefined;
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!sortRootRef.current?.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () =>
      document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [isSortMenuOpen]);

  const commitSortKey = (sortKey: SortKey) => {
    onFiltersChange({ sortKey });
    closeSortMenu();
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent,
    optionIndex: number
  ) => {
    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        const nextIndex = (optionIndex + 1) % SORT_OPTIONS.length;
        optionRefs.current[nextIndex]?.focus();
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        const previousIndex =
          (optionIndex - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length;
        optionRefs.current[previousIndex]?.focus();
        break;
      }
      case "Escape":
        event.preventDefault();
        closeSortMenu();
        break;
      case "Tab":
        // Close without trapping focus; let the browser move it naturally.
        closeSortMenu(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="entry-list-toolbar">
      <div className="entry-list-toolbar__search">
        <span className="entry-list-toolbar__search-icon" aria-hidden="true">
          <Icon icon={searchIcon} />
        </span>
        <input
          type="text"
          className="entry-list-toolbar__search-input"
          placeholder="Search entries"
          aria-label="Search entries"
          value={entryFilters.search}
          onChange={(event) =>
            onFiltersChange({ search: event.currentTarget.value })
          }
        />
      </div>
      <div className="entry-list-toolbar__sort" ref={sortRootRef}>
        <button
          type="button"
          ref={sortButtonRef}
          className="entry-list-toolbar__sort-button"
          aria-label="Sort entries"
          aria-haspopup="menu"
          aria-expanded={isSortMenuOpen}
          onClick={() =>
            isSortMenuOpen ? closeSortMenu() : setIsSortMenuOpen(true)
          }
        >
          Sort:{" "}
          <strong className="entry-list-toolbar__sort-current">
            {selectedOption.buttonLabel}
          </strong>
        </button>
        {isSortMenuOpen && (
          <div
            className="entry-list-toolbar__sort-menu"
            role="menu"
            aria-label="Sort by"
          >
            <div className="entry-list-toolbar__sort-menu-header">Sort by</div>
            {SORT_OPTIONS.map((option, optionIndex) => {
              const isSelected = option.key === entryFilters.sortKey;
              return (
                <button
                  key={option.key}
                  type="button"
                  ref={(element) => {
                    optionRefs.current[optionIndex] = element;
                  }}
                  role="menuitemradio"
                  aria-checked={isSelected}
                  className={`entry-list-toolbar__sort-option${
                    isSelected
                      ? " entry-list-toolbar__sort-option--selected"
                      : ""
                  }`}
                  onClick={() => commitSortKey(option.key)}
                  onKeyDown={(event) => handleOptionKeyDown(event, optionIndex)}
                >
                  <span className="entry-list-toolbar__sort-option-text">
                    <span className="entry-list-toolbar__sort-option-label">
                      {option.menuLabel}
                      {option.isDefault && (
                        <span className="entry-list-toolbar__sort-option-tag">
                          Default
                        </span>
                      )}
                    </span>
                    {option.subtitle && (
                      <span className="entry-list-toolbar__sort-option-subtitle">
                        {option.subtitle}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <span
                      className="entry-list-toolbar__sort-option-check"
                      aria-hidden="true"
                    >
                      <Icon icon={checkIcon} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <button
        type="button"
        ref={filtersButtonRef}
        className={`entry-list-toolbar__filters-button${
          isFilterSheetOpen ? " entry-list-toolbar__filters-button--engaged" : ""
        }`}
        aria-label={
          activeFilterCount
            ? `Open filters (${activeFilterCount} active)`
            : "Open filters"
        }
        aria-expanded={isFilterSheetOpen}
        onClick={onOpenFilters}
      >
        <span className="entry-list-toolbar__filters-icon" aria-hidden="true">
          <Icon icon={filterIcon} />
        </span>
        Filters
        {activeFilterCount > 0 && (
          <span className="entry-list-toolbar__filters-badge" aria-hidden="true">
            {activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default EntryListToolbar;
