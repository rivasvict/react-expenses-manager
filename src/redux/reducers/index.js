import { combineReucers } from 'redux';
import { reducer as expensesManagerReducer } from './reducers/expensesManagerReducer';

export default combineReucers({
  expensesManager: expensesManagerReducer
});
