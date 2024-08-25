import { combineReducers } from "redux";
import { reducer as commonManagerReducer } from "./common/reducer";
import { reducer as expensesManagerReducer } from "./expensesManager/reducer";
import { reducer as userManagerReducer } from "./userManager/reducer";

export default combineReducers({
  expensesManager: expensesManagerReducer,
  userManager: userManagerReducer,
  commonManage: commonManagerReducer,
});
