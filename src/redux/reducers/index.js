import { combineReducers } from 'redux';
import { reducer as expensesManagerReducer } from './expensesManagerReducer';
import { authenticationReducer } from "./authenticationReducer";
import { IS_LOADING } from "../actions/index";

const defaultState = {
  isLoading: false
};

const mainReducer = (state = defaultState, action) => {
  const { type, payload } = action;
  switch (type) {
    case IS_LOADING: return {
      ...state,
      isLoading: payload.isLoading
    }
    default: return state;
  }
}

export default combineReducers({
  expensesManager: expensesManagerReducer,
  authentication: authenticationReducer,
  main: mainReducer
});
