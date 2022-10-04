import {
  postConfigAuthenticated,
  setObjectToSessionStorage,
} from "../../helpers/general";
import { getBalance } from "../expensesManager/actionCreators";
import { postConfig } from "../../helpers/general";
import { config } from "../../config";
import { Dispatch } from "react";
import { ActionCreator } from "redux";

export const CREATE_USER_SUCCESS = "CREATE_USER_SUCCESS";
export const CREATE_USER_ERROR = "CREATE_USER_ERROR";
export const SET_APP_LOADING = "SET_APP_LOADING";
export const USER_LOG_IN_ERROR = "USER_LOG_IN_ERROR";
export const USER_LOG_IN_SUCCESS = "USER_LOG_IN_SUCCESS";
export const SET_USER_LOADING = "SET_USER_LOADING";
export const USER_LOG_OUT_ERROR = "USER_LOG_OUT_ERROR";
export const USER_LOG_OUT_SUCCESS = "USER_LOG_OUT_SUCCESS";
const baseUrl = config.REACT_APP_API_HOST;

const CreateUser = () => (userPayload) => {
  return async (dispatch) => {
    try {
      const url = `${baseUrl}/api/user/sign-up`;
      const body = JSON.stringify({ user: userPayload });
      dispatch(setAppLoading(true));
      const rawResponse = await fetch(url, {
        ...postConfig,
        body,
      });
      const response = await rawResponse.json();
      if (!rawResponse.ok) {
        dispatch(setAppLoading(false));
        throw response;
      }

      dispatch(setAppLoading(false));
      notifyUserCreation(dispatch);
    } catch (error) {
      dispatch(userCreationFail(error));
    }
  };
};

type WindowFetch<T> = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<T>;

type PostConfig = {
  method: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  headers: Headers;
};

type HTTPCredentials = {
  credentials: "same-origin" | "include";
};

type PostConfigAuthenticated = PostConfig & HTTPCredentials;

const LogIn =
  ({
    req,
    JSON,
    postConfigAuthenticated,
    setUserLoading,
    setAppLoading,
    setUserLocally,
    userLoginError,
  }: {
    req: WindowFetch<Response>;
    json: JSON;
    postConfigAuthenticated: PostConfigAuthenticated;
    setUserLoading: ActionCreator<boolean>;
    setAppLoading: ActionCreator<boolean>;
    setUserLocally: ({ dispatch, rawResponse, response }) => void;
    userLoginError: ActionCreator<Error>;
  }) =>
  ({ userPayload }) => {
    return async (dispatch) => {
      try {
        const url = `${baseUrl}/api/user/login`;
        const body = JSON.stringify({ user: userPayload });
        dispatch(setAppLoading(true));
        dispatch(setUserLoading(true));
        const rawResponse = await req(url, {
          body,
          ...postConfigAuthenticated,
        });
        const response = await rawResponse.json();

        setUserLocally({ dispatch, rawResponse, response });
      } catch (error) {
        dispatch(userLoginError(error));
      }
    };
  };

const LogOut =
  ({ req, setAppLoading, setUserLoading, removeUserLocally, userOutError }) =>
  () => {
    return async (dispatch) => {
      try {
        const url = `${baseUrl}/api/user/log-out`;
        dispatch(setAppLoading(true));
        dispatch(setUserLoading(true));
        const rawResponse = await req(url, postConfigAuthenticated);
        const response = await rawResponse.json();

        removeUserLocally({ dispatch, rawResponse, response });
      } catch (error) {
        dispatch(userOutError(error));
      }
    };
  };

const SetUser = ({  }) => () => {
  return async (dispatch) => {
    try {
      const email = sessionStorage.getItem("email");
      if (email) {
        const url = `${baseUrl}/api/user/get/${email}`;
        dispatch(setUserLoading(true));
        dispatch(setAppLoading(true));
        const rawResponse = await fetch(url, {
          credentials: "include",
        });
        const response = await rawResponse.json();

        setUserLocally({ dispatch, rawResponse, response });
      } else {
        dispatch(setAppLoading(false));
        dispatch(setUserLoading(false));
      }
    } catch (error) {
      dispatch(userLoginError(error));
    }
  };
};

export const ActionCreators = ({ fetch, json, postConfigAuthenticated }: { fetch: WindowFetch<Response>, json: JSON, postConfigAuthenticated: PostConfigAuthenticated }) => {
  const userCreationFail = (error) => ({
    type: CREATE_USER_ERROR,
    payload: error,
  });

  const hasUserBeenCreated = (user) => ({
    type: CREATE_USER_SUCCESS,
    payload: user,
  });

  const setUserLoading = (isUserLoading) => ({
    type: SET_USER_LOADING,
    payload: { isUserLoading },
  });

  const setAppLoading = (isLoading) => ({
    type: SET_APP_LOADING,
    payload: { isLoading: isLoading },
  });

  const userLoginSuccess = (user) => ({
    type: USER_LOG_IN_SUCCESS,
    payload: user,
  });

  const userLoginError = (error) => ({
    type: USER_LOG_IN_ERROR,
    payload: error,
  });

  const userLogOutSuccess = () => ({
    type: USER_LOG_OUT_SUCCESS,
  });

  const userOutError = (error) => ({
    type: USER_LOG_OUT_ERROR,
    payload: error,
  });

  const notifyUserCreation = (dispatch) => {
    dispatch(hasUserBeenCreated(true));
    dispatch(hasUserBeenCreated(false));
  };

  const setUserLocally = ({ dispatch, rawResponse, response }) => {
    dispatch(setAppLoading(false));
    dispatch(setUserLoading(false));

    if (!rawResponse.ok) {
      throw response;
    }

    setObjectToSessionStorage(response);
    dispatch(userLoginSuccess(response));
    dispatch(getBalance());
  };

  const removeUserLocally = ({ dispatch, rawResponse, response }) => {
    dispatch(setAppLoading(false));
    dispatch(setUserLoading(false));

    if (!rawResponse.ok) {
      throw response;
    }

    // TODO: We need to clean the session storage
    setObjectToSessionStorage(response);
    dispatch(userLogOutSuccess());
  };

  return {
    createUser: CreateUser(),
    logIn: LogIn({ req: fetch, json, postConfigAuthenticated, setAppLoading, setUserLocally, setUserLoading }),
    setUser: SetUser(),
    logOut: LogOut(),
  };
};
