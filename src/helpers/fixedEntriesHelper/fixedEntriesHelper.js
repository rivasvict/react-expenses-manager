import { getMonthKey, getTimestampFromMonthAndYear } from "../date";

/**
 * Fixed (recurring) incomes and expenses (issue #103).
 *
 * A fixed entry is a regular income/expense (amount + description + category)
 * that the user marks as recurring, so it shows up automatically in every
 * month. The user can create as many as they want, including several in the
 * same category.
 *
 * To make edits and removals take effect from the edited month *forward* (while
 * leaving past months untouched), each entry keeps its own chronologically
 * ordered history of "effective-from" states rather than a single value:
 *
 *   [
 *     {
 *       id,                       // stable identity of the recurring entry
 *       type: "income" | "expense",
 *       history: [
 *         { from: "YYYY-MM", amount, description, categories_path },  // a state
 *         { from: "YYYY-MM", removed: true },                        // tombstone
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 *
 * The active state for a month is the most recent history item whose `from` is
 * on or before that month. A `removed` tombstone marks the entry as gone from
 * that month forward, again without touching earlier months.
 */

const PLURAL_BY_TYPE = {
  income: "incomes",
  expense: "expenses",
};

// Fixed entries are stored as a flat list of recurring-entry definitions.
const getEmptyFixedEntries = () => [];

const byFromAscending = (firstState, secondState) =>
  firstState.from < secondState.from ? -1 : 1;

// Returns the active state of a single recurring entry for `monthKey`: the most
// recent history item effective on or before that month. Returns `null` when
// nothing applies yet or the latest applicable item is a removal tombstone.
const resolveFixedEntryState = (history, monthKey) => {
  if (!history?.length) return null;
  const applicable = history
    .filter((state) => state.from <= monthKey)
    .sort(byFromAscending);
  if (!applicable.length) return null;
  const latest = applicable[applicable.length - 1];
  return latest.removed ? null : latest;
};

// Sets the state effective from `from`, replacing any change already recorded
// for that same month so repeated edits in a month stay idempotent. Past months
// keep their value. `state` is either the editable fields or `{ removed: true }`.
const setHistoryState = (history = [], from, state) =>
  [...history.filter((item) => item.from !== from), { from, ...state }].sort(
    byFromAscending
  );

// Appends a brand new recurring entry effective from `from`. Returns a new list.
const addFixedEntryDefinition = (
  fixedEntries,
  { id, type, from, amount, description, categories_path }
) => [
  ...(fixedEntries || []),
  {
    id,
    type,
    history: [{ from, amount, description, categories_path }],
  },
];

// Applies a forward-only change to one recurring entry, identified by id,
// without mutating the input (safe against the Redux state). `state` carries the
// new editable fields or `{ removed: true }`.
const updateFixedEntryDefinition = (fixedEntries, { id, from, ...state }) =>
  (fixedEntries || []).map((definition) =>
    definition.id === id
      ? { ...definition, history: setHistoryState(definition.history, from, state) }
      : definition
  );

// Builds the synthetic entry that represents a recurring entry materialized for
// a given month. It mirrors the shape of a real entry so every existing view
// (sums, charts, bucket spending, filters, the edit screen) treats it like a
// manual one. `fixedId`/`isFixed` let the edit screen route back to the
// recurring entry; the id is deterministic and unique within any single month.
const buildFixedEntry = ({ definition, state, year, month }) => ({
  id: `fixed-${definition.id}`,
  fixedId: definition.id,
  isFixed: true,
  type: definition.type,
  amount: state.amount,
  description: state.description,
  categories_path: state.categories_path,
  date: getTimestampFromMonthAndYear({ month, year }),
});

/**
 * Injects the active recurring entries into every month already present in the
 * grouped `entries[year][month]` tree, so they appear in each month
 * automatically. The input tree is not mutated; a shallow copy is returned with
 * fresh month/type arrays where fixed entries were added.
 *
 * @param {Object} params
 * @param {Object} params.entries - The nested `entries[year][month]` tree.
 * @param {Array<Object>} params.fixedEntries - The recurring-entry definitions.
 * @returns {Object} A new entries tree with fixed entries materialized.
 */
const materializeFixedEntries = ({ entries, fixedEntries }) => {
  if (!entries || !fixedEntries?.length) return entries;

  const materialized = {};
  Object.keys(entries).forEach((year) => {
    const numericYear = Number(year);
    materialized[year] = {};
    Object.keys(entries[year]).forEach((month) => {
      const numericMonth = Number(month);
      const monthKey = getMonthKey({ year: numericYear, month: numericMonth });
      const monthEntries = entries[year][month];
      const monthCopy = { ...monthEntries };

      fixedEntries.forEach((definition) => {
        const state = resolveFixedEntryState(definition.history, monthKey);
        if (!state) return;
        const plural = PLURAL_BY_TYPE[definition.type];
        if (!plural) return;
        monthCopy[plural] = [
          ...(monthCopy[plural] || monthEntries[plural] || []),
          buildFixedEntry({
            definition,
            state,
            year: numericYear,
            month: numericMonth,
          }),
        ];
      });

      materialized[year][month] = monthCopy;
    });
  });

  return materialized;
};

export {
  getEmptyFixedEntries,
  resolveFixedEntryState,
  setHistoryState,
  addFixedEntryDefinition,
  updateFixedEntryDefinition,
  materializeFixedEntries,
  buildFixedEntry,
};
