import {
  getCurrentEmptyMonth,
  getGroupedFilledEntriesByDate,
  toYearMonth,
} from "../../helpers/entriesHelper/entriesHelper";
import { getCurrentTimestamp } from "../../helpers/date";
import { readFileAsText } from "./utils";
import {
  buildBackupEnvelope,
  parseBackupEnvelope,
} from "../../helpers/backupHelper/backupHelper";
import { getAddedBy } from "../../services/session";
export const ADD_OUTCOME = "ADD_OUTCOME";
export const ADD_INCOME = "ADD_INCOME";
export const CATEGORY_CHANGE = "CATEGORY_CHANGE";
export const GET_BALANCE = "GET_BALANCE";
export const CLEAR_ALL_DATA = "CLEAR_ALL_DATA";
export const SET_SELECTED_DATE = "SET_SELECTED_DATE";
export const EDIT_ENTRY = "EDIT_ENTRY";
export const REMOVE_ENTRY = "REMOVE_ENTRY";
export const GET_BUCKETS = "GET_BUCKETS";
export const GET_BUCKET = "GET_BUCKET";
export const EDIT_BUCKET = "SET_BUCKET";
export const ADD_BUCKET = "ADD_BUCKET";
export const ADD_CATEGORY = "ADD_CATEGORY";
export const GET_CATEGORIES = "GET_CATEGORIES";
export const GET_FIXED_ENTRIES = "GET_FIXED_ENTRIES";
export const SET_FIXED_ENTRY = "SET_FIXED_ENTRY";
export const RESTORE_BACKUP = "RESTORE_BACKUP";

// TODO: AS THIS IS A COMMON ACTION, IT SHOULD
// LIVE IN ITS OWN FILE

export const SET_APP_LOADING = "SET_APP_LOADING";

const setAppLoading = (isLoading) => ({
  type: SET_APP_LOADING,
  payload: { isLoading: isLoading },
});

const AddExpense =
  ({ storage }) =>
  ({ entry, selectedDate }) =>
    setNewRecord({ entry, type: ADD_OUTCOME, selectedDate }, { storage });

const AddIncome =
  ({ storage }) =>
  ({ entry, selectedDate }) =>
    setNewRecord({ entry, type: ADD_INCOME, selectedDate }, { storage });

const SetSelectedDate = () => (newSelectedDate) => ({
  type: SET_SELECTED_DATE,
  payload: newSelectedDate,
});

const CategoryChange = () => (categoryValue) => ({
  type: CATEGORY_CHANGE,
  payload: categoryValue,
});

// Reads the persisted balance together with the fixed-entries config (issue
// #103) and groups them into the nested tree with the fixed incomes/expenses
// materialized into every month. Centralized so every flow that rebuilds the
// tree (load, edit, remove, fixed-entry changes) keeps fixed entries in sync.
const getMaterializedEntries = async ({ storage }) => {
  const balance = await storage.getBalance();
  const fixedEntries = await storage.getFixedEntries();
  const entries = getGroupedFilledEntriesByDate()(balance, fixedEntries);
  return { entries, fixedEntries };
};

const GetBalance =
  ({ storage }) =>
  () => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const { entries, fixedEntries } = await getMaterializedEntries({
          storage,
        });
        dispatch({
          type: GET_BALANCE,
          payload: { entries },
        });
        dispatch({
          type: GET_FIXED_ENTRIES,
          payload: { fixedEntries },
        });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

// Attribution (AC-1.6, RFC §2.3): newly created items are stamped with the
// logged-in account at the action-creator layer; storage stays a dumb store.
// Logged out → no field at all.
const withAddedBy = (item) => {
  const addedBy = getAddedBy();
  return addedBy ? { ...item, addedBy } : item;
};

const setNewRecord = ({ entry, type, selectedDate }, { storage }) => {
  return async (dispatch) => {
    try {
      dispatch(setAppLoading(true));
      const savedEntry = await storage.setNewRecord(withAddedBy(entry));
      // TODO: Revisit this against the pattern of action creators
      dispatch({ type, payload: { entry: savedEntry, selectedDate } });
      dispatch(setAppLoading(false));
    } catch (error) {
      console.log(error);
    }
  };
};

const GetEntryById =
  ({ storage }) =>
  ({ entryId }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const entry = await storage.getEntryById(entryId);
        dispatch(setAppLoading(false));
        return entry;
      } catch (error) {
        console.log(error);
      }
    };
  };

const EditEntry =
  ({ storage }) =>
  ({ entry }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const newBalance = await storage.editEntry({ entry });
        const fixedEntries = await storage.getFixedEntries();
        const entries = getGroupedFilledEntriesByDate()(
          newBalance,
          fixedEntries
        );
        dispatch({ type: EDIT_ENTRY, payload: { entries } });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

const RemoveEntry =
  ({ storage }) =>
  ({ entryId }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const newBalance = await storage.removeEntry({ entryId });
        const fixedEntries = await storage.getFixedEntries();
        const entries = getGroupedFilledEntriesByDate()(
          newBalance,
          fixedEntries
        );
        dispatch({ type: REMOVE_ENTRY, payload: { entries } });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

// Builds the single-file backup (issue #109): one JSON envelope with the
// whole persisted state (balance, buckets, categories, fixedEntries), so a
// restore can rebuild the app exactly without a lossy CSV round trip.
const GetBackupData =
  ({ storage }) =>
  () => {
    return async (dispatch) => {
      dispatch(setAppLoading(true));
      try {
        const data = await storage.exportData();
        const envelope = buildBackupEnvelope(data);
        const json = JSON.stringify(envelope, null, 2);
        const fileName = `expenses-backup-${getCurrentTimestamp()}`;
        return { json, fileName };
      } finally {
        dispatch(setAppLoading(false));
      }
    };
  };

// Restores the whole app from a single backup file (issue #109): validates
// the file before writing anything, then replaces storage and the live Redux
// state wholesale so the app matches the file exactly.
const RestoreBackup =
  ({ storage }) =>
  ({ file }) => {
    return async (dispatch) => {
      dispatch(setAppLoading(true));
      try {
        const text = await readFileAsText({ file });
        const data = parseBackupEnvelope(text);
        await storage.importData(data);
        const entries = getGroupedFilledEntriesByDate()(
          data.balance,
          data.fixedEntries
        );
        dispatch({
          type: RESTORE_BACKUP,
          payload: {
            entries,
            buckets: data.buckets,
            unbudgetedCategories: data.categories,
            fixedEntries: data.fixedEntries,
          },
        });
      } finally {
        dispatch(setAppLoading(false));
      }
    };
  };

const ClearAllData =
  ({ storage }) =>
  () => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        await storage.clearAllData();
        dispatch({
          type: CLEAR_ALL_DATA,
          payload: { entries: getCurrentEmptyMonth() },
        });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

const GetBuckets =
  ({ storage }) =>
  ({ buckets }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const response = await storage.getBuckets({ buckets });
        /** YOU NEED TO FIND A BETTER WAY TO INITIALIZE THIS VARIABLE IN src/services/storageSelector/LocalStorage/index.js:77 */
        response?.length !== 0
          ? dispatch({
              type: GET_BUCKETS,
              payload: { buckets: response },
            })
          : dispatch({ type: GET_BUCKETS });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

const EditBucket =
  ({ storage }) =>
  ({ bucket, selectedDate }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const [bucketName, limit] = Object.entries(bucket)[0];
        const fromYearMonth = toYearMonth(selectedDate.year, selectedDate.month);
        const response = await storage.editBucket({
          bucketName,
          limit,
          fromYearMonth,
          addedBy: getAddedBy(),
        });
        dispatch({
          type: EDIT_BUCKET,
          payload: { buckets: response },
        });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

// Creates a bucket (spending limit) for an already-existing category (issue
// #100). The storage layer validates that the category is non-empty and does
// not already have a bucket, so the error is surfaced to the caller (the
// AddBucket form) to display. Once a category gets a bucket it is no longer a
// standalone category, so it is removed from `state.unbudgetedCategories`.
const AddBucket =
  ({ storage }) =>
  ({ bucket }) => {
    return async (dispatch) => {
      dispatch(setAppLoading(true));
      try {
        const response = await storage.addBucket({
          bucket,
          addedBy: getAddedBy(),
        });
        const [categoryName] = Object.keys(bucket);
        dispatch({
          type: ADD_BUCKET,
          payload: { buckets: response, categoryName },
        });
        return response;
      } finally {
        dispatch(setAppLoading(false));
      }
    };
  };

// Creates a brand new expense category, independent of any bucket (issue
// #100/#71). The category becomes selectable right away when adding an
// expense or creating a bucket.
const AddCategory =
  ({ storage }) =>
  ({ category }) => {
    return async (dispatch) => {
      dispatch(setAppLoading(true));
      try {
        const response = await storage.addCategory({ category });
        dispatch({
          type: ADD_CATEGORY,
          payload: { unbudgetedCategories: response },
        });
        return response;
      } finally {
        dispatch(setAppLoading(false));
      }
    };
  };

const GetCategories =
  ({ storage }) =>
  () => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const response = await storage.getCategories();
        dispatch({
          type: GET_CATEGORIES,
          payload: { unbudgetedCategories: response || [] },
        });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

const GetBucket =
  ({ storage }) =>
  ({ bucketName }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const response = await storage.getBucket({ bucketName });
        dispatch(setAppLoading(false));
        return response;
      } catch (error) {
        console.log(error);
      }
    };
  };

const GetFixedEntries =
  ({ storage }) =>
  () => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const fixedEntries = await storage.getFixedEntries();
        dispatch({ type: GET_FIXED_ENTRIES, payload: { fixedEntries } });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

// Persists a change to the recurring entries (add, forward edit, or forward
// removal) via `persist`, then re-materializes the balance so the change shows
// up in the affected month and forward without touching past months (#103).
const persistFixedEntriesAndRefresh = ({ storage, persist }) => {
  return async (dispatch) => {
    dispatch(setAppLoading(true));
    try {
      const fixedEntries = await persist(storage);
      const balance = await storage.getBalance();
      const entries = getGroupedFilledEntriesByDate()(balance, fixedEntries);
      dispatch({ type: GET_BALANCE, payload: { entries } });
      dispatch({ type: SET_FIXED_ENTRY, payload: { fixedEntries } });
      return fixedEntries;
    } finally {
      dispatch(setAppLoading(false));
    }
  };
};

// Creates a recurring entry from the given month forward.
const AddFixedEntry =
  ({ storage }) =>
  ({ entry, from }) =>
    persistFixedEntriesAndRefresh({
      storage,
      persist: (s) => s.addFixedEntry({ entry: withAddedBy(entry), from }),
    });

// Edits a recurring entry (by id) from the given month forward. Each new
// history state is an independently syncable item, so it gets its own
// attribution stamp (RFC §2.3).
const EditFixedEntry =
  ({ storage }) =>
  ({ id, from, amount, description, categories_path }) =>
    persistFixedEntriesAndRefresh({
      storage,
      persist: (s) =>
        s.editFixedEntry({
          id,
          from,
          amount,
          description,
          categories_path,
          addedBy: getAddedBy(),
        }),
    });

// Removes a recurring entry (by id) from the given month forward.
const RemoveFixedEntry =
  ({ storage }) =>
  ({ id, from }) =>
    persistFixedEntriesAndRefresh({
      storage,
      persist: (s) => s.removeFixedEntry({ id, from, addedBy: getAddedBy() }),
    });

export const ActionCreators = ({ storage }) => {
  return {
    addExpense: AddExpense({ storage }),
    addIncome: AddIncome({ storage }),
    categoryChange: CategoryChange(),
    getBalance: GetBalance({ storage }),
    restoreBackup: RestoreBackup({ storage }),
    clearAllData: ClearAllData({ storage }),
    setSelectedDate: SetSelectedDate(),
    getEntryById: GetEntryById({ storage }),
    editEntry: EditEntry({ storage }),
    removeEntry: RemoveEntry({ storage }),
    getBackupData: GetBackupData({ storage }),
    getBuckets: GetBuckets({ storage }),
    editBucket: EditBucket({ storage }),
    addBucket: AddBucket({ storage }),
    getBucket: GetBucket({ storage }),
    addCategory: AddCategory({ storage }),
    getCategories: GetCategories({ storage }),
    getFixedEntries: GetFixedEntries({ storage }),
    addFixedEntry: AddFixedEntry({ storage }),
    editFixedEntry: EditFixedEntry({ storage }),
    removeFixedEntry: RemoveFixedEntry({ storage }),
  };
};
