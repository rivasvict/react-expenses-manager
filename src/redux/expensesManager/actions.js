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

const UploadBackup =
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

const setNewRecord = ({ entry, type, selectedDate }, { storage }) => {
  return async (dispatch) => {
    try {
      dispatch(setAppLoading(true));
      await storage.setNewRecord(entry);
      // TODO: Revisit this against the pattern of action creators
      dispatch({ type, payload: { entry, selectedDate } });
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
        const balance = storage.getBalance();
        const csvBackup = dataParser.jsonToCsv({ json: balance });
        dispatch(setAppLoading(false));

        const fileName = `balance-backup-${getCurrentTimestamp()}`;
        return { csvContent: csvBackup, fileName };
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
  };
};
