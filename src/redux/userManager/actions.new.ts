import { Axios } from "axios";
import { ActionCreator } from "redux";
import { req as mockedApi } from '../../services/mock-api.ts';

type Fetch = <T>(url: string, RequestInit) => Promise<T>;

interface IpostConfigAuthenticated {
  method: "POST" | "PUT" | "DELETE" | "PATCH" | "GET";
  headers: Headers;
  credentials: "include" | "omit" | "same-origin";
}

/**
 * TODO: Move this type to the a better place for types
 */

type UserCredentials = {
  username: string,
  password: string,
}

/** TODO: This User type should belong to the setUserLocally
 * file function definiton
 */
type User = {
  /** TODO: Figure out a way to move the following 2
   * attributes into another custom type.
   */
  __v: number,
  _id: string,
  accounts: string[],
  email: string,
  firstName: string,
  lastName: string,
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
    req: any;
    postConfigAuthenticated: IpostConfigAuthenticated;
    setUserLocally: ({ dispatch, rawResponse, response }) => void;
    userLoginError: ActionCreator<Error>;
  }) =>
  ({ userPayload }: { userPayload: UserCredentials }) => {
    return async (dispatch) => {
      try {
        const url = `${baseUrl}/api/user/login`;
        const body = json.stringify({ user: userPayload });
        dispatch(setAppLoading(true));
        dispatch(setUserLoading(true));
        const rawResponse = await req.get(url, {
          body,
          ...postConfigAuthenticated,
        });
        /** TODO: Adapt response from mocked api */
        debugger;
        const response: User = await rawResponse.json();

        setUserLocally({ dispatch, rawResponse, response });
      } catch (error) {
        debugger;
        dispatch(userLoginError(error));
        dispatch(setAppLoading(false));
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
    req: Axios;
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
          const rawResponse = await req.post(url, {
            credentials: "include",
          });
          const response = await rawResponse;

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
      /** TODO: Temporary mock api usage */
      req: mockedApi,
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
