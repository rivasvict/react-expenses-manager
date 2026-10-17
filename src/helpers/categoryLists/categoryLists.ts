// The user's income and expense categories (category management,
// design/features/category-management/ui/decision.md): two separate lists
// of display names, stored under the `categoryLists` localStorage key. An
// entry belongs to a category when the second comma-delimited segment of its
// `categories_path` (`,eating out,`) equals the category's name in lower case.
import { capitalize } from "lodash";
import {
  INCOME_CATEGORIES,
  getExpenseCategoryNames,
} from "../entriesHelper/entriesHelper";
import { defaultTranslator, Translator } from "../../i18n/translator";

export type CategoryType = "expense" | "income";

export interface CategoryLists {
  expense: string[];
  income: string[];
}

// The persisted data a category list is built from, or kept consistent with.
export interface CategorySources {
  balance?: any[];
  fixedEntries?: any[];
  buckets?: { [name: string]: any } | any[];
  categories?: string[];
}

export const CATEGORY_TYPES: CategoryType[] = ["expense", "income"];

export const getEmptyCategoryLists = (): CategoryLists => ({
  expense: [],
  income: [],
});

export const isCategoryType = (value: unknown): value is CategoryType =>
  value === "expense" || value === "income";

const sameName = (first: string, second: string) =>
  first.trim().toLowerCase() === second.trim().toLowerCase();

/** `,eating out,` for "Eating out" — the format entries store. */
export const categoryPathOf = (name: string): string =>
  `,${name.trim().toLowerCase()},`;

/** "eating out" for `,eating out,`; "" when the path has no category. */
export const categorySegmentOf = (path?: string): string =>
  ((path || "").split(",")[1] || "").trim().toLowerCase();

export const pathMatchesCategory = (path: string | undefined, name: string) =>
  categorySegmentOf(path) !== "" &&
  categorySegmentOf(path) === name.trim().toLowerCase();

export const findCategoryName = (
  names: string[],
  name: string
): string | undefined => names.find((existing) => sameName(existing, name));

const bucketNamesOf = (buckets: CategorySources["buckets"]) =>
  buckets && !Array.isArray(buckets) ? Object.keys(buckets) : [];

const appendMissing = (names: string[], candidates: string[]): string[] =>
  candidates.reduce(
    (list, candidate) =>
      candidate.trim() && !findCategoryName(list, candidate)
        ? [...list, candidate]
        : list,
    names
  );

// Every `{type, categories_path}` the entries and fixed entries hold.
const usedPathsByType = ({ balance = [], fixedEntries = [] }: CategorySources) => {
  const used: { type: CategoryType; path: string }[] = [];
  balance.forEach((entry: any) => {
    if (isCategoryType(entry?.type))
      used.push({ type: entry.type, path: entry.categories_path });
  });
  fixedEntries.forEach((definition: any) => {
    if (!isCategoryType(definition?.type)) return;
    (definition.history || []).forEach((state: any) => {
      if (state?.categories_path)
        used.push({ type: definition.type, path: state.categories_path });
    });
  });
  return used;
};

/**
 * Adds every category the data uses but the lists lack, so no entry is ever
 * left without a listed category: a category found in an entry's
 * `categories_path` is named after its lower-case segment, capitalised; a
 * bucket's name joins the expense list as it is spelled. Never removes or
 * renames anything.
 */
export const withCategoriesFromData = (
  lists: CategoryLists,
  sources: CategorySources
): CategoryLists => {
  const found: CategoryLists = getEmptyCategoryLists();
  usedPathsByType(sources).forEach(({ type, path }) => {
    const segment = categorySegmentOf(path);
    if (segment) found[type].push(capitalize(segment));
  });
  return {
    expense: appendMissing(
      appendMissing(lists.expense, bucketNamesOf(sources.buckets)),
      found.expense
    ),
    income: appendMissing(lists.income, found.income),
  };
};

/**
 * The one-time migration for installs that predate `categoryLists`: expense
 * categories are the seeds plus the stored unbudgeted `categories` plus the
 * bucket names (case-insensitively de-duplicated), income categories the
 * income seeds; then every category the entries and fixed entries use is
 * added (see withCategoriesFromData). Existing data is not rewritten.
 */
export const buildCategoryListsFromLegacy = (
  sources: CategorySources
): CategoryLists => {
  const buckets = sources.buckets && !Array.isArray(sources.buckets)
    ? sources.buckets
    : {};
  return withCategoriesFromData(
    {
      expense: getExpenseCategoryNames(buckets, sources.categories || []),
      income: [...INCOME_CATEGORIES],
    },
    sources
  );
};

/** A stored value is usable when it has a string list for each type. */
export const isCategoryLists = (value: any): value is CategoryLists =>
  Boolean(value) &&
  typeof value === "object" &&
  CATEGORY_TYPES.every(
    (type) =>
      Array.isArray(value[type]) &&
      value[type].every((name: unknown) => typeof name === "string")
  );

/** The names sorted alphabetically in the UI language. */
export const sortCategoryNames = (names: string[], language = "en") =>
  [...names].sort((first, second) =>
    first.localeCompare(second, language, { sensitivity: "base" })
  );

/**
 * Validates a category name for `type`: it must not be empty and no other
 * category of the same type may already use it (case-insensitive, trimmed).
 * `currentName` is the category being renamed, which may keep its own name
 * or change only its letter case.
 */
export const getCategoryNameError = (
  {
    name,
    type,
    categoryLists,
    currentName,
  }: {
    name: string;
    type: CategoryType;
    categoryLists: CategoryLists;
    currentName?: string;
  },
  { t }: Translator = defaultTranslator
): string | null => {
  const trimmedName = (name || "").trim();
  if (!trimmedName) return t("validation.categoryNameEmpty");
  const clash = (categoryLists[type] || []).some(
    (existing) =>
      sameName(existing, trimmedName) &&
      !(currentName && sameName(existing, currentName))
  );
  if (!clash) return null;
  return type === "income"
    ? t("categorySheet.duplicateIncome", { name: trimmedName })
    : t("categorySheet.duplicateExpense", { name: trimmedName });
};
