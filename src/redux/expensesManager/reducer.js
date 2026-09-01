import _ from "lodash";
import { getCurrentMonth, getCurrentYear } from "../../helpers/date";

import {
  ADD_OUTCOME,
  ADD_INCOME,
  CATEGORY_CHANGE,
  GET_BALANCE,
  SET_SELECTED_DATE,
  EDIT_ENTRY,
  REMOVE_ENTRY,
  CLEAR_ALL_DATA,
  GET_BUCKETS,
  EDIT_BUCKET,
  ADD_BUCKET,
  ADD_CATEGORY,
  GET_CATEGORIES,
  GET_FIXED_ENTRIES,
  SET_FIXED_ENTRY,
  RESTORE_BACKUP,
  SET_ENTRY_FILTERS,
  CLEAR_ENTRY_FILTERS,
  GET_ENTRY_FILTERS,
} from "./actions";
import { getEmptyFixedEntries } from "../../helpers/fixedEntriesHelper/fixedEntriesHelper";
import { getDefaultEntryFilters } from "../../helpers/entriesHelper/filterSortHelper";

const staticInitialState = {
  entries: {},
  category: "",
  // Buckets start empty: they are created by the user and stored for later
  // retrieval. The screen shows an empty state until the first bucket is added.
  buckets: {},
  // Categories the user created that do not have a bucket (spending limit,
  // i.e. an allowance/budget) yet (issue #100/#71).
  unbudgetedCategories: [],
  // Fixed (recurring) incomes/expenses per category, time-aware so edits and
  // removals propagate from a month forward (issue #103). Empty by default.
  fixedEntries: getEmptyFixedEntries(),
  // Filters & sorting for the entry lists (search, scope, category, sort key).
  // One shared state so the toolbar, the filter sheet and (later) both
  // /summary lists can never diverge. Persisted to localStorage by the
  // entry-filters action creators.
  entryFilters: getDefaultEntryFilters(),
};

// selectedDate must be evaluated lazily (inside the reducer, not at module-load
// time) so that tests using jest.setSystemTime() see the fake clock value.
const getInitialSelectedDate = () => ({
  month: getCurrentMonth(),
  year: getCurrentYear(),
});

const getEntryWithCalculableAmount = (entry) => ({
  amount: parseFloat(entry.amount),
  ..._.omit(entry, "amount"),
});

const addEntry = ({ entry, entryType, state, selectedDate }) => {
  const selectedYear = selectedDate.year;
  const selectedMonth = selectedDate.month;
  const entryWithCalculableAmount = getEntryWithCalculableAmount(entry);
  const entriesToInsert = [
    ...state.entries[selectedYear][selectedMonth][entryType],
    entryWithCalculableAmount,
  ];
  const newState = _.chain({})
    .merge(state)
    .merge({
      entries: {
        [selectedYear]: {
          [selectedMonth]: {
            [entryType]: entriesToInsert,
          },
        },
      },
    })
    .value();
  return newState;
};

const changeCategory = ({ categoryValue, currentState }) => {
  return { ...currentState, category: categoryValue };
};

const changeSelectedDate = ({ newSelectedDateValue, currentState }) => {
  return { ...currentState, selectedDate: newSelectedDateValue };
};

export const reducer = (state, action) => {
  if (state === undefined) {
    state = { ...staticInitialState, selectedDate: getInitialSelectedDate() };
  }
  const { type, payload } = action;
  switch (type) {
    case ADD_OUTCOME:
      return addEntry({
        entry: payload.entry,
        selectedDate: payload.selectedDate,
        entryType: "expenses",
        state,
      });
    case ADD_INCOME:
      return addEntry({
        entry: payload.entry,
        selectedDate: payload.selectedDate,
        entryType: "incomes",
        state,
      });
    case CATEGORY_CHANGE:
      return changeCategory({ categoryValue: payload, currentState: state });
    case GET_BALANCE:
      return {
        ...state,
        entries: {
          ...state.entries,
          ...payload.entries,
        },
      };
    case SET_SELECTED_DATE:
      return changeSelectedDate({
        newSelectedDateValue: payload,
        currentState: state,
      });
    case EDIT_ENTRY:
      return {
        ...state,
        entries: {
          ...state.entries,
          ...payload.entries,
        },
      };
    case REMOVE_ENTRY:
      return {
        ...state,
        entries: {
          ...state.entries,
          ...payload.entries,
        },
      };
    case CLEAR_ALL_DATA:
      return {
        ...state,
        entries: {
          ...state.entries,
          ...payload.entries,
        },
      };
    case GET_BUCKETS:
      return payload
        ? {
            ...state,
            buckets: {
              ...state.buckets,
              ...payload.buckets,
            },
          }
        : state;
    case EDIT_BUCKET:
      return {
        ...state,
        buckets: {
          ...state.buckets,
          ...payload.buckets,
        },
      };
    case ADD_BUCKET:
      return {
        ...state,
        buckets: {
          ...state.buckets,
          ...payload.buckets,
        },
        unbudgetedCategories: (state.unbudgetedCategories || []).filter(
          (categoryName) =>
            categoryName.toLowerCase() !== payload.categoryName?.toLowerCase()
        ),
      };
    case ADD_CATEGORY:
      return {
        ...state,
        unbudgetedCategories: payload.unbudgetedCategories,
      };
    case GET_CATEGORIES:
      return {
        ...state,
        unbudgetedCategories: payload.unbudgetedCategories,
      };
    case SET_ENTRY_FILTERS:
      return {
        ...state,
        entryFilters: { ...state.entryFilters, ...payload },
      };
    case CLEAR_ENTRY_FILTERS:
      return { ...state, entryFilters: getDefaultEntryFilters() };
    case GET_ENTRY_FILTERS:
      return { ...state, entryFilters: payload.entryFilters };
    case GET_FIXED_ENTRIES:
    case SET_FIXED_ENTRY:
      return {
        ...state,
        fixedEntries: payload.fixedEntries,
      };
    // Single-file backup restore (issue #109): replaces every slice wholesale
    // so the live app matches the imported file exactly, rather than merging
    // with whatever was there before the restore.
    case RESTORE_BACKUP:
      return {
        ...state,
        entries: payload.entries,
        buckets: payload.buckets,
        unbudgetedCategories: payload.unbudgetedCategories,
        fixedEntries: payload.fixedEntries,
      };
    default:
      return state;
  }
};
