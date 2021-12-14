import { getGroupedFilledEntriesByDate } from "../../helpers/entriesHelper/entriesHelper";
import { postConfigAuthenticated } from "../../helpers/general";
export const ADD_OUTCOME = 'ADD_OUTCOME';
export const ADD_INCOME = 'ADD_INCOME';
export const CATEGORY_CHANGE = 'CATEGORY_CHANGE'
export const GET_BALANCE = 'GET_BALANCE';
export const SET_SELECTED_DATE = 'SET_SELECTED_DATE';
const baseUrl = `${process.env.REACT_APP_API_HOST}:${process.env.REACT_APP_API_PORT}`

// TODO: AS THIS IS A COMMON ACTION, IT SHOULD
// LIVE IN ITS OWN FILE

export const SET_APP_LOADING = 'SET_APP_LOADING';

const setAppLoading = isLoading => ({
  type: SET_APP_LOADING,
  payload: { isLoading: isLoading }
});

const AddExpense = () => ({ entry, selectedDate }) => setRecord({ entry, type: ADD_OUTCOME, selectedDate });

const AddIncome = () => ({ entry, selectedDate }) => setRecord({ entry, type: ADD_INCOME, selectedDate });

const SetSelectedDate = () => newSelectedDate => ({
  type: SET_SELECTED_DATE,
  payload: newSelectedDate
});

const CategoryChange = () => categoryValue => ({
  type: CATEGORY_CHANGE,
  payload: categoryValue
});

const GetBalance = () => () => {
  return async (dispatch) => {
    try {
      const url = `${baseUrl}/api/balance`;
      dispatch(setAppLoading(true));
      const rawResponse = await fetch(url, {
        credentials: 'include'
      });
      const response = await rawResponse.json();
      const fullEntriesWithFilledDates = getGroupedFilledEntriesByDate()(response);
      dispatch({ type: GET_BALANCE, payload: { entries: fullEntriesWithFilledDates }});
      dispatch(setAppLoading(false));
    } catch (error) {
      console.log(error);
    }
  };
};

const setRecord = ({ entry, type, selectedDate }) => {
  return async (dispatch) => {
    try {
      const url = `${baseUrl}/api/balance`;
      const body = JSON.stringify(entry);
      dispatch(setAppLoading(true));
      await fetch(url, { body, ...postConfigAuthenticated });
      // TODO: Revisit this against the pattern of action creators
      dispatch({ type, payload: { entry, selectedDate } });
      dispatch(setAppLoading(false));
    } catch (error) {
      console.log(error);
    }
  }
};

export const ActionCreators = () => ({
  addExpense: AddExpense(),
  addIncome: AddIncome(),
  categoryChange: CategoryChange(),
  getBalance: GetBalance(),
  setSelectedDate: SetSelectedDate()
});