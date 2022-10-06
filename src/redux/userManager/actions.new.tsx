import { ActionCreator } from "redux";

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
    req: <T>(url: string, RequestInit) => Promise<T>;
    postConfigAuthenticated: {
      method: "POST" | "PUT" | "DELETE" | "PATCH" | "GET";
      headers: Headers;
      credentials: "include" | "omit" | "same-origin";
    };
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

export const ActionCreatorNew = ({
  baseUrl,
  json,
  setAppLoading,
  setUserLoading,
  req,
  postConfigAuthenticated,
  setUserLocally,
  userLoginError,
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
  };
};
