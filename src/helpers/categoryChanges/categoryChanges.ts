// A rename or deletion of a category, applied to the persisted data in one
// pure step (design/features/category-management/ui/decision.md). The same
// function runs when the user makes the change on this device and when the
// change arrives from another party member through sync, so both end in
// exactly the same data. Every change is also kept in the `categoryChanges`
// log, which is what carries it through sync (see
// src/helpers/syncMergeHelper/syncMergeHelper.ts).
import {
  CategoryLists,
  CategoryType,
  categoryPathOf,
  findCategoryName,
  pathMatchesCategory,
} from "../categoryLists/categoryLists";

export interface CategoryChangeAuthor {
  id: string;
  name: string;
}

export interface CategoryChange {
  id: string;
  kind: "rename" | "delete";
  type: CategoryType;
  /** The category's name before the change. */
  name: string;
  /** rename: the new name. */
  newName?: string;
  /**
   * delete: the category each affected entry (by entry id) or fixed entry
   * (by fixed-entry id) moves to.
   */
  moves?: { [id: string]: string };
  /**
   * delete: where entries the change does not list go (entries another
   * member added before syncing). Absent when no entry moved.
   */
  fallback?: string;
  /** When it was made (Unix ms). */
  at: number;
  by?: CategoryChangeAuthor;
}

export interface CategoryData {
  balance: any[];
  fixedEntries: any[];
  buckets: { [name: string]: any };
  categoryLists?: CategoryLists;
}

/** One entry or fixed entry a change touches, and where it goes. */
export interface AffectedEntry {
  id: string;
  fixed: boolean;
  description: string;
  amount: any;
  /** Unix ms for an entry; undefined for a fixed entry. */
  date?: number;
  type: CategoryType;
  /** The category it ends up in; undefined when a deletion leaves it. */
  target?: string;
}

const belongsTo = (type: CategoryType, name: string) => (entry: any) =>
  entry?.type === type && pathMatchesCategory(entry.categories_path, name);

const fixedUses = (
  definition: any,
  { type, name }: { type: CategoryType; name: string }
) =>
  definition?.type === type &&
  (definition.history || []).some((state: any) =>
    pathMatchesCategory(state?.categories_path, name)
  );

// Where an entry of the changed category goes, by its id.
const targetFor = (change: CategoryChange, id: string): string | undefined =>
  change.kind === "rename"
    ? change.newName
    : (change.moves && change.moves[id]) || change.fallback;

/** Latest non-removed state of a fixed entry, for display. */
const currentFixedState = (definition: any) => {
  const states = (definition.history || []).filter(
    (state: any) => !state.removed
  );
  return states[states.length - 1] || {};
};

/**
 * The entries and fixed entries of `type` filed under the category `name`,
 * in data order (entries first, then fixed entries).
 */
export const getEntriesInCategory = (
  data: Pick<CategoryData, "balance" | "fixedEntries">,
  type: CategoryType,
  name: string
): AffectedEntry[] => {
  const entries = (data.balance || [])
    .filter(belongsTo(type, name))
    .map((entry: any) => ({
      id: entry.id,
      fixed: false,
      description: entry.description || "",
      amount: entry.amount,
      date: Number(entry.date),
      type,
    }));
  const fixed = (data.fixedEntries || [])
    .filter((definition: any) => fixedUses(definition, { type, name }))
    .map((definition: any) => {
      const state = currentFixedState(definition);
      return {
        id: definition.id,
        fixed: true,
        description: state.description || "",
        amount: state.amount,
        type,
      };
    });
  return [...entries, ...fixed];
};

/** The entries and fixed entries `change` moves, and where each one goes. */
export const getAffectedEntries = (
  data: Pick<CategoryData, "balance" | "fixedEntries">,
  change: CategoryChange
): AffectedEntry[] =>
  getEntriesInCategory(data, change.type, change.name).map((entry) => ({
    ...entry,
    target: targetFor(change, entry.id),
  }));

const movePath = (item: any, change: CategoryChange, id: string) => {
  const target = targetFor(change, id);
  return target && pathMatchesCategory(item.categories_path, change.name)
    ? { ...item, categories_path: categoryPathOf(target) }
    : item;
};

const applyToBalance = (balance: any[], change: CategoryChange) =>
  balance.map((entry) =>
    belongsTo(change.type, change.name)(entry)
      ? movePath(entry, change, entry.id)
      : entry
  );

const applyToFixedEntries = (fixedEntries: any[], change: CategoryChange) =>
  fixedEntries.map((definition) =>
    definition?.type === change.type
      ? {
          ...definition,
          history: (definition.history || []).map((state: any) =>
            movePath(state, change, definition.id)
          ),
        }
      : definition
  );

// Buckets are expense-only and mirror their category: a rename moves the
// limit history to the new name (a bucket the new name already has wins), a
// deletion removes it.
const applyToBuckets = (
  buckets: CategoryData["buckets"],
  change: CategoryChange
) => {
  if (change.type !== "expense") return buckets;
  const bucketName = findCategoryName(Object.keys(buckets), change.name);
  if (!bucketName) return buckets;
  const { [bucketName]: history, ...others } = buckets;
  if (change.kind === "delete") return others;
  const newName = change.newName as string;
  const clash = findCategoryName(Object.keys(others), newName);
  return clash ? others : { ...others, [newName]: history };
};

const applyToLists = (
  lists: CategoryLists,
  change: CategoryChange,
  stillUsed: boolean
): CategoryLists => {
  const names = lists[change.type] || [];
  const current = findCategoryName(names, change.name);
  let next = names;
  if (change.kind === "rename") {
    const newName = change.newName as string;
    const clash = names.find(
      (name) => name !== current && findCategoryName([name], newName)
    );
    next = current
      ? clash
        ? names.filter((name) => name !== current)
        : names.map((name) => (name === current ? newName : name))
      : clash
        ? names
        : [...names, newName];
  } else if (!stillUsed) {
    next = names.filter((name) => name !== current);
  }
  return { ...lists, [change.type]: next };
};

/**
 * Applies a rename or a deletion to the data: every entry and fixed entry of
 * the change's type filed under the category gets its new `categories_path`
 * (`,new name,`), the category list follows, and so does the bucket. A
 * deletion that leaves some entries where they were (an unknown entry and no
 * fallback) keeps the category listed. Never mutates its input.
 */
export const applyCategoryChange = <T extends CategoryData>(
  data: T,
  change: CategoryChange
): T => {
  const balance = applyToBalance(data.balance || [], change);
  const fixedEntries = applyToFixedEntries(data.fixedEntries || [], change);
  const stillUsed =
    balance.some(belongsTo(change.type, change.name)) ||
    fixedEntries.some((definition) => fixedUses(definition, change));
  return {
    ...data,
    balance,
    fixedEntries,
    buckets: applyToBuckets(data.buckets || {}, change),
    ...(data.categoryLists
      ? { categoryLists: applyToLists(data.categoryLists, change, stillUsed) }
      : {}),
  };
};

/** True for a well-formed change read from storage or a backup. */
export const isCategoryChange = (value: any): value is CategoryChange =>
  Boolean(value) &&
  typeof value.id === "string" &&
  (value.kind === "rename" || value.kind === "delete") &&
  (value.type === "expense" || value.type === "income") &&
  typeof value.name === "string" &&
  (value.kind !== "rename" || typeof value.newName === "string");
