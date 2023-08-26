import { req } from "../../services/mock-api.ts";
import { postConfigAuthenticated } from "../../helpers/general";
import { ActionCreatorNew } from "./actions.new.ts";
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
  req,
  postConfigAuthenticated,
  setUserLocally,
  userLoginError,
  removeUserLocally,
  userOutError,
  storage: sessionStorage,
});
