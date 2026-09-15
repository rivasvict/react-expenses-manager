import { capitalize } from "lodash";

/**
 * Pure filtering/sorting logic for the entry lists (/expenses, /incomes and,
 * later, /summary). Kept separate from entriesHelper.js so the new logic is
 * typed and unit-testable on its own (new files are TS per CLAUDE.md).
 */

export type SearchScope = "all" | "description";
export type SortKey = "date" | "amount" | "name";

export interface EntryFilters {
  /** Free-text search term ("" = no search). */
  search: string;
  /** "all" matches category + description; "description" only the description. */
  searchScope: SearchScope;
  /** `,category,` format, "" = no category filter (same values as today). */
  category: string;
  /** "date" (newest first, default) | "amount" (highest first) | "name" (A→Z). */
  sortKey: SortKey;
}

/** The minimal entry shape the filters/sort need. */
export interface FilterableEntry {
  amount: string | number;
  description?: string;
  date: number | string;
  categories_path: string;
}

export interface FilterDescriptor {
  key: keyof EntryFilters;
  label: string;
}

export const getDefaultEntryFilters = (): EntryFilters => ({
  search: "",
  searchScope: "all",
  category: "",
  sortKey: "date",
});

/** The `,eating out,` middle segment of a categories_path, "" when absent. */
const getCategorySegment = (categoriesPath: string): string =>
  (categoriesPath || "").split(",")[1] || "";

/**
 * Narrows a flat list of entries by search term (case-insensitive substring,
 * scoped to description and/or category name) and by category (literal
 * `categories_path` match, exactly like the pre-existing category filter —
 * regex-special names such as "House (Rent)" must keep matching). An empty
 * search/category is a no-op for that criterion.
 */
export const filterEntries = <T extends FilterableEntry>({
  entries,
  search = "",
  searchScope = "all",
  category = "",
}: {
  entries: T[];
  search?: string;
  searchScope?: SearchScope;
  category?: string;
}): T[] => {
  const normalizedSearch = search.trim().toLowerCase();

  return (entries || []).filter((entry) => {
    if (category.length && !entry.categories_path.includes(category)) {
      return false;
    }
    if (!normalizedSearch) return true;

    const description = (entry.description || "").toLowerCase();
    if (description.includes(normalizedSearch)) return true;

    return (
      searchScope === "all" &&
      getCategorySegment(entry.categories_path)
        .toLowerCase()
        .includes(normalizedSearch)
    );
  });
};

const compareStrings = (first: string, second: string): number => {
  const normalizedFirst = first.toLowerCase();
  const normalizedSecond = second.toLowerCase();
  if (normalizedFirst < normalizedSecond) return -1;
  if (normalizedFirst > normalizedSecond) return 1;
  return 0;
};

const comparators: Record<
  SortKey,
  (first: FilterableEntry, second: FilterableEntry) => number
> = {
  // Newest first.
  date: (first, second) => Number(second.date) - Number(first.date),
  // Highest first, on the absolute amount (amounts are stored as strings).
  amount: (first, second) =>
    Math.abs(parseFloat(String(second.amount))) -
    Math.abs(parseFloat(String(first.amount))),
  // Category name A→Z, tie-broken by description A→Z.
  name: (first, second) =>
    compareStrings(
      getCategorySegment(first.categories_path),
      getCategorySegment(second.categories_path)
    ) || compareStrings(first.description || "", second.description || ""),
};

/** Returns a NEW sorted array — the input is never mutated. */
export const sortEntries = <T extends FilterableEntry>(
  entries: T[],
  sortKey: SortKey
): T[] => [...(entries || [])].sort(comparators[sortKey]);

/**
 * One `{ key, label }` descriptor per active (non-default) filter. Drives the
 * removable chips in the filtered banner and the Filters-button badge count
 * (which counts the descriptors whose key is not "search").
 */
export const getActiveFilterDescriptors = ({
  entryFilters,
}: {
  entryFilters: EntryFilters;
}): FilterDescriptor[] => {
  const descriptors: FilterDescriptor[] = [];

  if (entryFilters.search.trim().length) {
    descriptors.push({ key: "search", label: `"${entryFilters.search.trim()}"` });
  }
  if (entryFilters.category.length) {
    descriptors.push({
      key: "category",
      label: `Category: ${capitalize(getCategorySegment(entryFilters.category))}`,
    });
  }
  if (entryFilters.searchScope === "description") {
    descriptors.push({ key: "searchScope", label: "Description only" });
  }

  return descriptors;
};
