/**
 * TODO:
 * This module has no colocated unit tests — its behaviour is currently only
 * asserted end-to-end via src/integrationTests/accounts.test.tsx and
 * src/redux/expensesManager/attribution.test.js. Direct coverage for the
 * expiry decode, the malformed-payload paths and `getAddedBy` is tracked in:
 * https://github.com/rivasvict/react-expenses-manager/issues/160
 */
// Tiny reader/writer for the sync session (docs/multi-user-sync/RFC.md §2.2):
// localStorage key "sync.session" present ⇔ logged in (AC-1.3/1.4, defined in
// docs/multi-user-sync/PRD.md). Kept as a standalone service so the
// expensesManager action creators can stamp `addedBy` without importing
// anything from the sync UI or Redux slice.
import { SyncUser } from "./syncApi/contract";

export const SESSION_STORAGE_KEY = "sync.session";

export interface SyncSession {
  token: string;
  user: SyncUser;
}

export interface AddedBy {
  id: string;
  name: string;
}

// Tokens are compact HMAC-signed: base64url(payload).base64url(sig) with
// payload { sub, iat, exp } (seconds). Returns the expiry in ms, or null
// when the token can't be decoded (treated as "no local expiry check").
const getTokenExpiryMs = (token: string): number | null => {
  try {
    const encoded = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(encoded));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch (error) {
    return null;
  }
};

export const clearSession = (): void => {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

// AC-1.3: the session persists until explicit logout or expiry — an expired
// token is dropped on read so the app simply renders logged out.
export const getSession = (): SyncSession | null => {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    const session: SyncSession = JSON.parse(raw);
    if (!session?.token || !session?.user) return null;
    const expiryMs = getTokenExpiryMs(session.token);
    if (expiryMs !== null && expiryMs <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch (error) {
    return null;
  }
};

export const setSession = (session: SyncSession): void => {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

// Attribution stamp for newly created items (RFC §2.3, AC-1.6). Undefined
// when logged out, so the field is simply absent on anonymous items.
export const getAddedBy = (): AddedBy | undefined => {
  const session = getSession();
  return session
    ? { id: session.user.id, name: session.user.firstName }
    : undefined;
};
