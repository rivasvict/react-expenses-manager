import { combineReducers } from 'redux';
import { reducer as expensesManagerReducer } from './expensesManager/reducer';
import { reducer as userManagerReducer } from "./userManager/reducer";

export default combineReducers({
  expensesManager: expensesManagerReducer,
  userManager: userManagerReducer
});
