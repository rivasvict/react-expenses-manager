// What a category holds, for the Categories screen and its sheets
// (design/features/category-management/ui/decision.md): how many entries and
// fixed entries use it, how much they add up to, and which they are.
import {
  AffectedEntry,
  getEntriesInCategory,
} from "../categoryChanges/categoryChanges";
import {
  CategoryType,
  pathMatchesCategory,
} from "../categoryLists/categoryLists";

export interface CategoryUsage {
  /** Entries plus fixed (recurring) entries filed under the category. */
  count: number;
  /** Every amount the category accounts for, fixed entries' months included. */
  total: number;
  entries: AffectedEntry[];
}

type EntriesTree = {
  [year: string]: { [month: string]: { [list: string]: any[] } };
};

const allTreeEntries = (tree: EntriesTree = {}): any[] =>
  Object.values(tree || {}).flatMap((months) =>
    Object.values(months || {}).flatMap((month) => [
      ...((month && month.incomes) || []),
      ...((month && month.expenses) || []),
    ])
  );

/**
 * The entries the user saved, read back from the nested `entries` tree: the
 * fixed entries the tree materializes into every month are left out (they
 * are listed once, from their definitions).
 */
export const getSavedEntries = (tree: EntriesTree = {}): any[] =>
  allTreeEntries(tree).filter((entry) => !entry.isFixed);

export const getCategoryUsage = (
  {
    entries,
    fixedEntries = [],
  }: { entries: EntriesTree; fixedEntries?: any[] },
  type: CategoryType,
  name: string
): CategoryUsage => {
  const listed = getEntriesInCategory(
    { balance: getSavedEntries(entries), fixedEntries },
    type,
    name
  );
  const total = allTreeEntries(entries)
    .filter(
      (entry) =>
        entry.type === type && pathMatchesCategory(entry.categories_path, name)
    )
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  return { count: listed.length, total, entries: listed };
};
