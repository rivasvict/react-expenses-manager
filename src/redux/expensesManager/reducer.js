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
  SET_BALANCE,
  CLEAR_ALL_DATA,
  GET_BUCKETS,
  EDIT_BUCKET,
  SET_BUCKETS,
  ADD_BUCKET,
  ADD_CATEGORY,
  GET_CATEGORIES,
  GET_FIXED_ENTRIES,
  SET_FIXED_ENTRY,
} from "./actions";
import { getEmptyFixedEntries } from "../../helpers/fixedEntriesHelper/fixedEntriesHelper";

const staticInitialState = {
  entries: {},
  category: "",
  /** TODO: When buckets will be fully implemented,
   * make sure these values do not exist and this
   * `buckets` object is empty. The buckets are
   * meant to be added by the user and stored for
   * later retrieval
   */
  buckets: {
    "Eating out": 300,
    Alcohol: 150,
    "House stuff": 100,
    Beauty: 100,
    Transportation: 300,
    "Fun activities": 200,
    Unexpected: 300,
    Sports: 250,
    "Person 1 bucket": 200,
    "Person 2 bucket": 200,
    Education: 86.45,
    "Baby stuff": 350,
  },
  // Categories the user created that do not have a bucket (spending limit,
  // i.e. an allowance/budget) yet (issue #100/#71).
  unbudgetedCategories: [],
  // Fixed (recurring) incomes/expenses per category, time-aware so edits and
  // removals propagate from a month forward (issue #103). Empty by default.
  fixedEntries: getEmptyFixedEntries(),
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
    case SET_BALANCE:
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
    case SET_BUCKETS:
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
    case GET_FIXED_ENTRIES:
    case SET_FIXED_ENTRY:
      return {
        ...state,
        fixedEntries: payload.fixedEntries,
      };
    default:
      return state;
  }
};
