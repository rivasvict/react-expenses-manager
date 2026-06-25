import { ENTRY_TYPES_SINGULAR, ENTRY_TYPES_PLURAL } from "../../constants";
import { getMonthKey, getTimestampFromMonthAndYear } from "../date";

/**
 * Fixed (recurring) incomes and expenses (issue #103).
 *
 * By default no category has a fixed amount. A user can optionally set a fixed
 * income and/or expense per category that then applies to *every* month. To make
 * edits and removals take effect from the edited month *forward* (leaving past
 * months untouched), each category keeps a chronologically ordered history of
 * "effective-from" entries instead of a single flat value:
 *
 *   {
 *     income:  { [category]: [{ from: "YYYY-MM", amount: number | null }, ...] },
 *     expense: { [category]: [{ from: "YYYY-MM", amount: number | null }, ...] }
 *   }
 *
 * The active amount for a month is the most recent entry whose `from` is on or
 * before that month. An `amount` of `null` is a tombstone: it marks the fixed
 * entry as removed from that month forward, again without touching earlier
 * months.
 */

const FIXED_ENTRY_TYPES = [
  ENTRY_TYPES_SINGULAR.INCOME,
  ENTRY_TYPES_SINGULAR.EXPENSE,
];

const PLURAL_BY_TYPE = {
  [ENTRY_TYPES_SINGULAR.INCOME]: ENTRY_TYPES_PLURAL.INCOMES,
  [ENTRY_TYPES_SINGULAR.EXPENSE]: ENTRY_TYPES_PLURAL.EXPENSES,
};

const getEmptyFixedEntries = () => ({
  [ENTRY_TYPES_SINGULAR.INCOME]: {},
  [ENTRY_TYPES_SINGULAR.EXPENSE]: {},
});

// Normalizes whatever is stored (or nothing) into the full config shape so the
// rest of the helpers can assume both buckets of categories exist.
const normalizeFixedEntries = (fixedEntries) => ({
  ...getEmptyFixedEntries(),
  ...(fixedEntries || {}),
  [ENTRY_TYPES_SINGULAR.INCOME]: {
    ...(fixedEntries?.[ENTRY_TYPES_SINGULAR.INCOME] || {}),
  },
  [ENTRY_TYPES_SINGULAR.EXPENSE]: {
    ...(fixedEntries?.[ENTRY_TYPES_SINGULAR.EXPENSE] || {}),
  },
});

// Returns the amount that is active for `monthKey` given a category history:
// the most recent entry effective on or before that month. Returns `null` when
// nothing applies yet or the latest applicable entry is a removal tombstone.
const resolveFixedAmount = (history, monthKey) => {
  if (!history?.length) return null;
  const applicable = history
    .filter((entry) => entry.from <= monthKey)
    .sort((firstEntry, secondEntry) =>
      firstEntry.from < secondEntry.from ? -1 : 1
    );
  if (!applicable.length) return null;
  const { amount } = applicable[applicable.length - 1];
  return amount === null || amount === undefined ? null : amount;
};

// Sets the fixed amount (or a removal tombstone when `amount` is null) effective
// from `from`, replacing any change already recorded for that same month so
// repeated edits in a month stay idempotent. Past months keep their value.
const setFixedEntryHistory = (history = [], { from, amount }) =>
  [...history.filter((entry) => entry.from !== from), { from, amount }].sort(
    (firstEntry, secondEntry) => (firstEntry.from < secondEntry.from ? -1 : 1)
  );

// Returns a new config with the change applied to a single category history,
// without mutating the input (so it is safe to use against the Redux state).
const applyFixedEntry = (fixedEntries, { type, category, from, amount }) => {
  const normalized = normalizeFixedEntries(fixedEntries);
  const typeHistories = normalized[type];
  return {
    ...normalized,
    [type]: {
      ...typeHistories,
      [category]: setFixedEntryHistory(typeHistories[category], {
        from,
        amount,
      }),
    },
  };
};

const getCategorySlug = (category) => category.toLowerCase().replace(/\s/g, "-");

// Builds the synthetic entry that represents a fixed income/expense for a given
// month. It mirrors the shape of a real entry so every existing view (sums,
// charts, bucket spending, filters) treats it exactly like a manual one. The id
// is deterministic so re-materializing never produces duplicates or churn.
const buildFixedEntry = ({ type, category, amount, year, month }) => ({
  id: `fixed-${type}-${getCategorySlug(category)}-${year}-${month}`,
  amount,
  // Flags the entry as recurring across every view that lists entries.
  description: "Fixed",
  type,
  categories_path: `,${category.toLowerCase()},`,
  date: getTimestampFromMonthAndYear({ month, year }),
  isFixed: true,
});

/**
 * Injects the resolved fixed incomes/expenses into every month already present
 * in the grouped `entries[year][month]` tree, so they appear in each month
 * automatically. The input tree is not mutated; a shallow copy is returned with
 * fresh month/type arrays where fixed entries were added.
 *
 * @param {Object} params
 * @param {Object} params.entries - The nested `entries[year][month]` tree.
 * @param {Object} params.fixedEntries - The fixed-entries config.
 * @returns {Object} A new entries tree with fixed entries materialized.
 */
const materializeFixedEntries = ({ entries, fixedEntries }) => {
  const normalized = normalizeFixedEntries(fixedEntries);
  const hasAnyFixed = FIXED_ENTRY_TYPES.some(
    (type) => Object.keys(normalized[type]).length > 0
  );
  if (!entries || !hasAnyFixed) return entries;

  const materialized = {};
  Object.keys(entries).forEach((year) => {
    const numericYear = Number(year);
    materialized[year] = {};
    Object.keys(entries[year]).forEach((month) => {
      const numericMonth = Number(month);
      const monthKey = getMonthKey({ year: numericYear, month: numericMonth });
      const monthEntries = entries[year][month];

      const monthCopy = { ...monthEntries };
      FIXED_ENTRY_TYPES.forEach((type) => {
        const plural = PLURAL_BY_TYPE[type];
        const fixedForType = normalized[type];
        const fixedEntriesForMonth = Object.keys(fixedForType)
          .map((category) => {
            const amount = resolveFixedAmount(
              fixedForType[category],
              monthKey
            );
            if (amount === null) return null;
            return buildFixedEntry({
              type,
              category,
              amount,
              year: numericYear,
              month: numericMonth,
            });
          })
          .filter(Boolean);

        if (fixedEntriesForMonth.length) {
          monthCopy[plural] = [
            ...(monthEntries[plural] || []),
            ...fixedEntriesForMonth,
          ];
        }
      });
      materialized[year][month] = monthCopy;
    });
  });

  return materialized;
};

export {
  FIXED_ENTRY_TYPES,
  getEmptyFixedEntries,
  normalizeFixedEntries,
  resolveFixedAmount,
  setFixedEntryHistory,
  applyFixedEntry,
  materializeFixedEntries,
  buildFixedEntry,
};
