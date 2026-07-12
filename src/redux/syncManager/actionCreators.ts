// Thunk action creators for account and party state. API errors are
// re-thrown so the calling screen can render the exact copy for each error
// code (DESIGN §2/§3).
import { Dispatch } from "redux";
import * as syncApi from "../../services/syncApi";
import { AuthResponse, Party } from "../../services/syncApi/contract";
import { clearSession, getSession, setSession } from "../../services/session";
import {
  SYNC_PARTY_SET,
  SYNC_SESSION_CLEARED,
  SYNC_SESSION_SET,
} from "./actions";

const storeSession = (dispatch: Dispatch, { token, user }: AuthResponse) => {
  const session = { token, user };
  setSession(session);
  dispatch({ type: SYNC_SESSION_SET, payload: { session } });
};

const setParty = (dispatch: Dispatch, party: Party | null) => {
  dispatch({ type: SYNC_PARTY_SET, payload: { party } });
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

// Refreshes the party from GET /me (RFC §2.2: membership is never cached
// as authoritative). A dead token is handled centrally by syncApi (session
// cleared + store notified), so it is swallowed here; other failures leave
// the previous party state alone.
export const refreshMe =
  () =>
  async (dispatch: Dispatch): Promise<void> => {
    const session = getSession();
    if (!session) return;
    try {
      const { party } = await syncApi.getMe({ token: session.token });
      setParty(dispatch, party);
    } catch (error) {
      // Intentionally quiet: screens render from the last known state.
    }
  };

// AC-2.1: creates the party; the caller becomes its organizer.
export const createParty =
  () =>
  async (dispatch: Dispatch): Promise<Party> => {
    const session = getSession();
    if (!session) throw new Error("Not signed in");
    const { party } = await syncApi.createParty({ token: session.token });
    setParty(dispatch, party);
    return party;
  };

// AC-2.3: returns the one-time invitation code; no Redux state changes —
// the code lives only in the invite screen's component state.
export const generateInvitation =
  ({ password }: { password: string }) =>
  async (): Promise<string> => {
    const session = getSession();
    if (!session) throw new Error("Not signed in");
    const { code } = await syncApi.createInvitation({
      token: session.token,
      password,
    });
    return code;
  };

// AC-2.5–2.7: redeems an invitation; errors (EC-6/7/8) are re-thrown for
// the join screen's copy.
export const joinParty =
  ({ code, password }: { code: string; password: string }) =>
  async (dispatch: Dispatch): Promise<Party> => {
    const session = getSession();
    if (!session) throw new Error("Not signed in");
    const { party } = await syncApi.joinParty({
      token: session.token,
      code,
      password,
    });
    setParty(dispatch, party);
    return party;
  };

// AC-2.9: blocks a member (organizer only). The member keeps their record
// — and their already-synced entries — but immediately loses sync access.
export const blockMember =
  ({ userId }: { userId: string }) =>
  async (dispatch: Dispatch): Promise<Party> => {
    const session = getSession();
    if (!session) throw new Error("Not signed in");
    const { party } = await syncApi.blockMember({
      token: session.token,
      userId,
    });
    setParty(dispatch, party);
    return party;
  };

// AC-2.10: cancels the party (organizer only). Nobody's local data is
// touched; the canceled state re-renders for every member on /me refresh.
export const cancelParty =
  () =>
  async (dispatch: Dispatch): Promise<Party> => {
    const session = getSession();
    if (!session) throw new Error("Not signed in");
    const { party } = await syncApi.cancelParty({ token: session.token });
    setParty(dispatch, party);
    return party;
  };
