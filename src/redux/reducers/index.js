import { combineReducers } from 'redux';
import { reducer as expensesManagerReducer } from './expensesManagerReducer';
import { authenticationReducer } from "./authenticationReducer";

export default combineReducers({
  expensesManager: expensesManagerReducer,
  authentication: authenticationReducer
});
