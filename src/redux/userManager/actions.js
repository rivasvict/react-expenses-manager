import { getBalance } from "../expensesManager/actionCreators";
import { postConfig, setObjectToSessionStorage } from "../../helpers/general";
import { config } from "../../config";
import { req } from "../../services/mock-api.ts";

export const CREATE_USER_SUCCESS = 'CREATE_USER_SUCCESS';
export const CREATE_USER_ERROR = 'CREATE_USER_ERROR';
export const SET_APP_LOADING = 'SET_APP_LOADING';
export const USER_LOG_IN_ERROR = 'USER_LOG_IN_ERROR';
export const USER_LOG_IN_SUCCESS = 'USER_LOG_IN_SUCCESS';
export const SET_USER_LOADING = 'SET_USER_LOADING';
export const USER_LOG_OUT_ERROR = 'USER_LOG_OUT_ERROR';
export const USER_LOG_OUT_SUCCESS = 'USER_LOG_OUT_SUCCESS';
/**
 * TODO: Remove the export once the ActionCreators
 * and ActionCreatorNew are together again as this
 * dependency will live within the same file where
 * it will be used.
 */
export const baseUrl = config.REACT_APP_API_HOST

const userCreationFail = error => ({
  type: CREATE_USER_ERROR,
  payload: error
})

const hasUserBeenCreated = user => ({
  type: CREATE_USER_SUCCESS,
  payload: user
});

export const setUserLoading = isUserLoading => ({
  type: SET_USER_LOADING,
  payload: { isUserLoading }
});

export const setAppLoading = isLoading => ({
  type: SET_APP_LOADING,
  payload: { isLoading: isLoading }
})

const userLoginSuccess = user => ({
  type: USER_LOG_IN_SUCCESS,
  payload: user
})

/**
 * TODO: Remove the export once the ActionCreators
 * and ActionCreatorNew are together again as this
 * dependency will live within the same file where
 * it will be used.
 */
export const userLoginError = error => ({
  type: USER_LOG_IN_ERROR,
  payload: error
})

const userLogOutSuccess = () => ({
  type: USER_LOG_OUT_SUCCESS,
})

/**
 * TODO: Remove the export once the ActionCreators
 * and ActionCreatorNew are together again as this
 * dependency will live within the same file where
 * it will be used.
 */
export const userOutError = error => ({
  type: USER_LOG_OUT_ERROR,
  payload: error
})

const notifyUserCreation = dispatch => {
  dispatch(hasUserBeenCreated(true));
  dispatch(hasUserBeenCreated(false));
};

const CreateUser = () => (userPayload) => {
  return async (dispatch) => {
    try {
      const url = `${baseUrl}/api/user/sign-up`;
      const body = JSON.stringify({ user: userPayload });
      dispatch(setAppLoading(true));
      const rawResponse = await req(url, {
        ...postConfig,
        data: body,
      });
      const response = await rawResponse.json()
      if (!rawResponse.ok) {
        dispatch(setAppLoading(false));
        throw response;
      }

      dispatch(setAppLoading(false));
      notifyUserCreation(dispatch);
    } catch (error) {
      dispatch(userCreationFail(error));
    }
  }
}

/**
 * TODO: Remove the export once the ActionCreators
 * and ActionCreatorNew are together again as this
 * dependency will live within the same file where
 * it will be used.
 */
export const setUserLocally = ({ dispatch, rawResponse, response }) => {
  dispatch(setAppLoading(false));
  dispatch(setUserLoading(false));

  if (!rawResponse.ok) {
    throw response;
  }

  setObjectToSessionStorage(response);
  dispatch(userLoginSuccess(response));
  dispatch(getBalance());
};

/**
 * TODO: Remove the export once the ActionCreators
 * and ActionCreatorNew are together again as this
 * dependency will live within the same file where
 * it will be used.
 */
export const removeUserLocally = ({ dispatch, rawResponse, response }) => {
  dispatch(setAppLoading(false));
  dispatch(setUserLoading(false));

  if (!rawResponse.ok) {
    throw response;
  }

  // TODO: We need to clean the session storage
  setObjectToSessionStorage(response);
  dispatch(userLogOutSuccess());
};

/**
 * TODO: Remove the export once the ActionCreators
 * and ActionCreatorNew are together again as this
 * dependency will live within the same file where
 * it will be used.
 */
export const ActionCreators = () => {
  return ({
    createUser: CreateUser()
  });
};
