// Thunk action creators for account state. API errors are re-thrown so the
// calling screen can render the exact copy for each error code (DESIGN §2).
import { Dispatch } from "redux";
import * as syncApi from "../../services/syncApi";
import { AuthResponse } from "../../services/syncApi/contract";
import { clearSession, setSession } from "../../services/session";
import { SYNC_SESSION_CLEARED, SYNC_SESSION_SET } from "./actions";

const storeSession = (dispatch: Dispatch, { token, user }: AuthResponse) => {
  const session = { token, user };
  setSession(session);
  dispatch({ type: SYNC_SESSION_SET, payload: { session } });
};

export const signUp =
  (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) =>
  async (dispatch: Dispatch): Promise<void> => {
    storeSession(dispatch, await syncApi.signup(payload));
  };

export const signIn =
  (payload: { email: string; password: string }) =>
  async (dispatch: Dispatch): Promise<void> => {
    storeSession(dispatch, await syncApi.login(payload));
  };

// Logout is client-side only (RFC §3): tokens are stateless, so deleting
// the stored session is the whole operation (AC-1.4).
export const logOut =
  () =>
  (dispatch: Dispatch): void => {
    clearSession();
    dispatch({ type: SYNC_SESSION_CLEARED });
  };
