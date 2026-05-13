import {
  getCurrentEmptyMonth,
  getGroupedFilledEntriesByDate,
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

const GetBalance =
  ({ storage }) =>
  () => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const response = await storage.getBalance();
        const fullEntriesWithFilledDates =
          getGroupedFilledEntriesByDate()(response);
        dispatch({
          type: GET_BALANCE,
          payload: { entries: fullEntriesWithFilledDates },
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
        const fullEntriesWithFilledDates =
          getGroupedFilledEntriesByDate()(balance);
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
        const entries = getGroupedFilledEntriesByDate()(newBalance);
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
        const entries = getGroupedFilledEntriesByDate()(newBalance);
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
  ({ bucket }) => {
    return async (dispatch) => {
      try {
        dispatch(setAppLoading(true));
        const response = await storage.editBucket({ bucket });
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
    getBucket: GetBucket({ storage }),
  };
};
