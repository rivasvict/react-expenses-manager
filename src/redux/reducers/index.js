import { combineReducers } from 'redux';
import { reducer as expensesManagerReducer } from './expensesManagerReducer';

export default combineReducers({
  expensesManager: expensesManagerReducer
});
