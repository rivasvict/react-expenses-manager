import { ActionCreator } from "redux";

type Fetch = <T>(url: string, RequestInit) => Promise<T>;

interface IpostConfigAuthenticated {
  method: "POST" | "PUT" | "DELETE" | "PATCH" | "GET";
  headers: Headers;
  credentials: "include" | "omit" | "same-origin";
}

const LogIn =
  ({
    baseUrl,
    json,
    setAppLoading,
    setUserLoading,
    req,
    postConfigAuthenticated,
    setUserLocally,
    userLoginError,
  }: {
    baseUrl: string;
    json: JSON;
    setAppLoading: ActionCreator<boolean>;
    setUserLoading: ActionCreator<boolean>;
    req: Fetch;
    postConfigAuthenticated: IpostConfigAuthenticated;
    setUserLocally: ({ dispatch, rawResponse, response }) => void;
    userLoginError: ActionCreator<Error>;
  }) =>
  ({ userPayload }) => {
    return async (dispatch) => {
      try {
        const url = `${baseUrl}/api/user/login`;
        const body = json.stringify({ user: userPayload });
        dispatch(setAppLoading(true));
        dispatch(setUserLoading(true));
        const rawResponse = await req<Response>(url, {
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
  ({
    baseUrl,
    setAppLoading,
    setUserLoading,
    req,
    postConfigAuthenticated,
    removeUserLocally,
    userOutError,
  }: {
    baseUrl: string;
    setAppLoading: ActionCreator<boolean>;
    setUserLoading: ActionCreator<boolean>;
    req: Fetch;
    postConfigAuthenticated: IpostConfigAuthenticated;
    removeUserLocally: ({ dispatch, rawResponse, response }) => void;
    userOutError: ActionCreator<Error>;
  }) =>
  () => {
    return async (dispatch) => {
      try {
        const url = `${baseUrl}/api/user/log-out`;
        dispatch(setAppLoading(true));
        dispatch(setUserLoading(true));
        const rawResponse: Response = await req(url, postConfigAuthenticated);
        const response = await rawResponse.json();

        removeUserLocally({ dispatch, rawResponse, response });
      } catch (error) {
        dispatch(userOutError(error));
      }
    };
  };

const SetUser =
  ({
    storage,
    baseUrl,
    setUserLoading,
    setAppLoading,
    req,
    setUserLocally,
    userLoginError,
  }: {
    storage: Storage;
    baseUrl: string;
    setUserLoading: ActionCreator<boolean>;
    setAppLoading: ActionCreator<boolean>;
    req: Fetch;
    setUserLocally: ({ dispatch, rawResponse, response }) => void;
    userLoginError: ActionCreator<Error>;
  }) =>
  () => {
    return async (dispatch) => {
      try {
        const email = storage.getItem("email");
        if (email) {
          const url = `${baseUrl}/api/user/get/${email}`;
          dispatch(setUserLoading(true));
          dispatch(setAppLoading(true));
          const rawResponse = await req<Response>(url, {
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

export const ActionCreatorNew = ({
  baseUrl,
  json,
  setAppLoading,
  setUserLoading,
  req,
  postConfigAuthenticated,
  setUserLocally,
  userLoginError,
  removeUserLocally,
  userOutError,
  storage
}) => {
  return {
    logIn: LogIn({
      baseUrl,
      json,
      setAppLoading,
      setUserLoading,
      req,
      postConfigAuthenticated,
      setUserLocally,
      userLoginError,
    }),
    logOut: LogOut({
      baseUrl,
      setAppLoading,
      setUserLoading,
      req,
      postConfigAuthenticated,
      removeUserLocally,
      userOutError,
    }),
    setUser: SetUser({
      storage,
      baseUrl,
      setUserLoading,
      setAppLoading,
      req,
      setUserLocally,
      userLoginError
    })
  };
};
