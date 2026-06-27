import {
  getCurrentEmptyMonth,
  getGroupedFilledEntriesByDate,
  toYearMonth,
} from "../../helpers/entriesHelper/entriesHelper";
import { getCurrentTimestamp } from "../../helpers/date";
import { getDataFromFile } from "./utils";
export const ADD_OUTCOME = "ADD_OUTCOME";
export const ADD_INCOME = "ADD_INCOME";
export const CATEGORY_CHANGE = "CATEGORY_CHANGE";
export const GET_BALANCE = "GET_BALANCE";
export const SET_BALANCE = "SET_BALANCE";
export const CLEAR_ALL_DATA = "CLEAR_ALL_DATA";
export const SET_SELECTED_DATE = "SET_SELECTED_DATE";
export const EDIT_ENTRY = "EDIT_ENTRY";
export const REMOVE_ENTRY = "REMOVE_ENTRY";
export const GET_BUCKETS = "GET_BUCKETS";
export const SET_BUCKETS = "SET_BUCKETS";
export const GET_BUCKET = "GET_BUCKET";
export const EDIT_BUCKET = "SET_BUCKET";
export const ADD_BUCKET = "ADD_BUCKET";
export const ADD_CATEGORY = "ADD_CATEGORY";
export const GET_CATEGORIES = "GET_CATEGORIES";
export const GET_FIXED_ENTRIES = "GET_FIXED_ENTRIES";
export const SET_FIXED_ENTRY = "SET_FIXED_ENTRY";

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

const UploadBalanceBackup =
  ({ storage, dataParser }) =>
  ({ file }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const balance = await getDataFromFile({ dataParser })({ file });
        await storage.setBalance({ balance });
        const fixedEntries = await storage.getFixedEntries();
        const fullEntriesWithFilledDates = getGroupedFilledEntriesByDate()(
          balance,
          fixedEntries
        );
        dispatch({
          type: SET_BALANCE,
          payload: { entries: fullEntriesWithFilledDates },
        });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

const UploadBucketsBackup =
  ({ storage, dataParser }) =>
  ({ file }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const bucketsData = await getDataFromFile({ dataParser })({ file });
        // We know that buckets is an array with a single object
        const [rawBuckets] = bucketsData;
        // We need to ensure that all bucket values are numbers
        const buckets = Object.fromEntries(
          Object.entries(rawBuckets).map(([k, v]) => {
            const n = Number(v);
            return [k, Number.isNaN(n) ? 0 : n];
          })
        );
        const response = await storage.editBuckets({ buckets });
        dispatch({
          type: SET_BUCKETS,
          payload: { buckets: response },
        });
        dispatch(setAppLoading(false));
      } catch (error) {
        console.log(error);
      }
    };
  };

const uploadCallbackMap = {
  balance: UploadBalanceBackup,
  buckets: UploadBucketsBackup,
};

const UploadBackup =
  ({ storage, dataParser }) =>
  ({ file, type }) => {
    const uploadCallback = uploadCallbackMap[type];
    if (uploadCallback) {
      return uploadCallback({ storage, dataParser })({ file });
    }
  };

const setNewRecord = ({ entry, type, selectedDate }, { storage }) => {
  return async (dispatch) => {
    try {
      dispatch(setAppLoading(true));
      const savedEntry = await storage.setNewRecord(entry);
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

const GetBackupData =
  ({ storage, dataParser }) =>
  () => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const balance = await storage.getBalance();
        const balanceCsv = dataParser.jsonToCsv({ json: balance });

        const buckets = await storage.getBuckets();
        const bucketsCsv = dataParser.jsonToCsv({ json: buckets });

        dispatch(setAppLoading(false));

        const ts = getCurrentTimestamp();
        const balanceFileName = `balance-backup-${ts}.csv`;
        const bucketsFileName = `buckets-backup-${ts}.csv`;

        return {
          balanceCsv,
          balanceFileName,
          bucketsCsv,
          bucketsFileName,
        };
      } catch (error) {
        console.log(error);
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
        const response = await storage.addBucket({ bucket });
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

// Persists a forward-only change to a fixed income/expense and re-materializes
// the balance so the new amount shows up in the affected month and forward
// without touching past months (issue #103). `amount: null` removes it forward.
const setFixedEntryAndRefresh =
  ({ storage }) =>
  ({ type, category, amount, from }) => {
    return async (dispatch) => {
      dispatch(setAppLoading(true));
      try {
        const fixedEntries = await storage.setFixedEntry({
          type,
          category,
          amount,
          from,
        });
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

const SetFixedEntry =
  ({ storage }) =>
  ({ type, category, amount, from }) =>
    setFixedEntryAndRefresh({ storage })({ type, category, amount, from });

const RemoveFixedEntry =
  ({ storage }) =>
  ({ type, category, from }) =>
    setFixedEntryAndRefresh({ storage })({
      type,
      category,
      amount: null,
      from,
    });

export const ActionCreators = ({ storage, dataParser }) => {
  return {
    addExpense: AddExpense({ storage }),
    addIncome: AddIncome({ storage }),
    categoryChange: CategoryChange(),
    getBalance: GetBalance({ storage }),
    uploadBackup: UploadBackup({ storage, dataParser }),
    clearAllData: ClearAllData({ storage }),
    setSelectedDate: SetSelectedDate(),
    getEntryById: GetEntryById({ storage }),
    editEntry: EditEntry({ storage }),
    removeEntry: RemoveEntry({ storage }),
    getBackupData: GetBackupData({ storage, dataParser }),
    getBuckets: GetBuckets({ storage }),
    editBucket: EditBucket({ storage }),
    addBucket: AddBucket({ storage }),
    getBucket: GetBucket({ storage }),
    addCategory: AddCategory({ storage }),
    getCategories: GetCategories({ storage }),
    getFixedEntries: GetFixedEntries({ storage }),
    setFixedEntry: SetFixedEntry({ storage }),
    removeFixedEntry: RemoveFixedEntry({ storage }),
  };
};
