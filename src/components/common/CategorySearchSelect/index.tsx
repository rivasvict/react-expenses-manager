import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./styles.scss";

export type CategorySearchOption = {
  value: string;
  label: string;
};

type CategorySearchSelectProps = {
  /** Same id the surrounding Form.Label already points at (htmlFor). */
  id: string;
  name: string;
  /** Currently selected value ("" = empty option). */
  value: string;
  /** Pre-built options; must NOT include the empty option itself. */
  options: CategorySearchOption[];
  /** "Select a category" | "All incomes" | "All expenses" | ... */
  emptyOptionLabel: string;
  /** Called with the committed raw value on selection. */
  onChange: (value: string) => void;
  className?: string;
  /** Search input placeholder. */
  placeholder?: string;
};

const OPEN_KEYS = ["Enter", " ", "ArrowDown", "ArrowUp"];

/**
 * Searchable replacement for the native category <select> (type-to-filter,
 * W3Schools filter-dropdown UX). Hand-built on the ARIA 1.2 combobox +
 * listbox popup pattern: the trigger looks exactly like `select.form-control`,
 * the popup panel holds a search input that filters the option rows with a
 * case-insensitive substring match. See the design spec for the full anatomy.
 */
const CategorySearchSelect = ({
  id,
  name,
  value,
  options,
  emptyOptionLabel,
  onChange,
  className = "",
  placeholder = "Search categories…",
}: CategorySearchSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // The empty option is a real row, always first, and subject to the same
  // filter as every other row.
  const allRows: CategorySearchOption[] = useMemo(
    () => [{ value: "", label: emptyOptionLabel }, ...options],
    [emptyOptionLabel, options]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return allRows;
    return allRows.filter((row) =>
      row.label.toLowerCase().includes(normalizedQuery)
    );
  }, [allRows, query]);

  const selectedRow = allRows.find((row) => row.value === value);
  const selectedLabel = selectedRow ? selectedRow.label : emptyOptionLabel;

  const openPanel = useCallback(() => {
    const selectedIndex = allRows.findIndex((row) => row.value === value);
    setQuery("");
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }, [allRows, value]);

  const closePanel = useCallback((shouldRefocusTrigger = true) => {
    setIsOpen(false);
    if (shouldRefocusTrigger) triggerRef.current?.focus();
  }, []);

  const commitOption = useCallback(
    (row: CategorySearchOption) => {
      onChange(row.value);
      closePanel();
    },
    [onChange, closePanel]
  );

  // Focus goes into the search input as soon as the panel opens.
  useEffect(() => {
    if (isOpen) searchRef.current?.focus();
  }, [isOpen]);

  // Click-outside closes the panel without changing the value. Attached only
  // while open, so there is no document-wide listener cost when idle.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentMouseDown);
    return () =>
      document.removeEventListener("mousedown", handleDocumentMouseDown);
  }, [isOpen]);

  // Keep the highlighted row visible when navigating with the keyboard.
  useEffect(() => {
    if (!isOpen || filteredRows.length === 0) return;
    const highlightedElement = listRef.current?.children[
      highlightedIndex
    ] as HTMLElement | undefined;
    // scrollIntoView is unavailable in jsdom, hence the optional call.
    highlightedElement?.scrollIntoView?.({ block: "nearest" });
  }, [isOpen, highlightedIndex, filteredRows.length]);

  const handleTriggerClick = () => {
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (OPEN_KEYS.includes(event.key)) {
      event.preventDefault();
      if (!isOpen) openPanel();
    }
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.currentTarget.value);
    // Highlight resets to the first row of the filtered set on each keystroke.
    setHighlightedIndex(0);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex((index) =>
          Math.min(index + 1, filteredRows.length - 1)
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex((index) => Math.max(index - 1, 0));
        break;
      case "Enter": {
        // preventDefault always: the control lives inside forms and Enter
        // must never submit them from the search box.
        event.preventDefault();
        const highlightedRow = filteredRows[highlightedIndex];
        if (highlightedRow) commitOption(highlightedRow);
        break;
      }
      case "Escape":
        event.preventDefault();
        closePanel();
        break;
      case "Tab":
        // Close without trapping focus; let the browser move it naturally.
        closePanel(false);
        break;
      default:
        break;
    }
  };

  const triggerClassName = [
    "form-control",
    "category-search-select__trigger",
    isOpen ? "category-search-select__trigger--open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`category-search-select ${className}`.trim()}
      ref={rootRef}
    >
      <div
        id={id}
        ref={triggerRef}
        className={triggerClassName}
        role="combobox"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-labelledby={`${id}-label`}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="category-search-select__value">{selectedLabel}</span>
      </div>
      {isOpen && (
        <div className="category-search-select__panel">
          <div className="category-search-select__search-wrap">
            <input
              ref={searchRef}
              type="text"
              className="form-control text category-search-select__search"
              placeholder={placeholder}
              aria-label="Search categories"
              aria-activedescendant={
                filteredRows[highlightedIndex]
                  ? `${id}-option-${highlightedIndex}`
                  : undefined
              }
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <ul
            ref={listRef}
            className="category-search-select__options"
            role="listbox"
            id={`${id}-listbox`}
            aria-label={name}
          >
            {filteredRows.length === 0 ? (
              <li className="category-search-select__empty-state">
                No matching categories
              </li>
            ) : (
              filteredRows.map((row, index) => {
                const optionClassName = [
                  "category-search-select__option",
                  index === highlightedIndex
                    ? "category-search-select__option--highlighted"
                    : "",
                  row.value === value
                    ? "category-search-select__option--selected"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <li
                    key={row.value === "" ? "__empty-option__" : row.value}
                    id={`${id}-option-${index}`}
                    role="option"
                    aria-selected={row.value === value}
                    className={optionClassName}
                    onClick={() => commitOption(row)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {row.label}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CategorySearchSelect;
