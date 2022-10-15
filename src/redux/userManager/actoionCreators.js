import { postConfigAuthenticated } from "../../helpers/general";
import { ActionCreatorNew } from "./actions.new.tsx";
/**
 * TODO: The actionCreators should be unified
 * in the future ActionCreatorNew will be the
 * ActionCreators that we currently have.
 */

import {
  setAppLoading,
  setUserLoading,
  setUserLocally,
  userLoginError,
  removeUserLocally,
  userOutError,
} from "./actions";
import { config } from "../../config";

/**
 * TODO: The actionCreators should be unified
 * in the future ActionCreatorNew will be the
 * ActionCreators that we currently have.
 */
export const { logIn, setUser, logOut } = ActionCreatorNew({
  baseUrl: config.REACT_APP_API_HOST,
  json: JSON,
  setAppLoading,
  setUserLoading,
  req: fetch,
  postConfigAuthenticated,
  setUserLocally,
  userLoginError,
  removeUserLocally,
  userOutError,
  storage: sessionStorage,
});
