import { reducer, SyncManagerState } from "./reducer";
import { SYNC_SESSION_CLEARED, SYNC_SESSION_SET } from "./actions";
import { SESSION_STORAGE_KEY, SyncSession } from "../../services/session";

/**
 * Unit tests for the syncManager slice (docs/multi-user-sync/RFC.md §1).
 * The slice's defining behaviour is that its default state hydrates from the
 * persisted session, which is what makes a login survive a reload
 * (AC-1.3, docs/multi-user-sync/PRD.md).
 */

const jane: SyncSession = {
  token: "token-for-jane",
  user: {
    id: "u1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  },
};

// Builds a token whose payload carries the given `exp` (seconds), matching
// the base64url(payload).base64url(sig) shape session.ts decodes.
const tokenExpiringAt = (expSeconds: number) => {
  const payload = window
    .btoa(JSON.stringify({ sub: "u1", iat: 0, exp: expSeconds }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${payload}.signature`;
};

const storeSession = (session: SyncSession) =>
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

const anyAction = { type: "SOMETHING_ELSE" };

beforeEach(() => {
  window.localStorage.clear();
});

describe("syncManager reducer", () => {
  describe("default state", () => {
    it("starts logged out when nothing is stored", () => {
      expect(reducer(undefined, anyAction)).toEqual({ session: null });
    });

    it("hydrates the stored session so a login survives a reload", () => {
      storeSession(jane);

      expect(reducer(undefined, anyAction)).toEqual({ session: jane });
    });

    it("starts logged out when the stored token has already expired", () => {
      const expired = { ...jane, token: tokenExpiringAt(1) };
      storeSession(expired);

      expect(reducer(undefined, anyAction)).toEqual({ session: null });
    });
  });

  describe("SYNC_SESSION_SET", () => {
    it("stores the session from the payload", () => {
      const state = reducer({ session: null }, {
        type: SYNC_SESSION_SET,
        payload: { session: jane },
      });

      expect(state).toEqual({ session: jane });
    });

    it("replaces an existing session rather than merging into it", () => {
      const bob: SyncSession = {
        token: "token-for-bob",
        user: {
          id: "u2",
          email: "bob@example.com",
          firstName: "Bob",
          lastName: "Stone",
        },
      };

      const state = reducer({ session: jane }, {
        type: SYNC_SESSION_SET,
        payload: { session: bob },
      });

      expect(state.session).toEqual(bob);
    });

    it("falls back to logged out when the payload carries no session", () => {
      const state = reducer({ session: jane }, { type: SYNC_SESSION_SET });

      expect(state).toEqual({ session: null });
    });
  });

  describe("SYNC_SESSION_CLEARED", () => {
    it("drops the session", () => {
      const state = reducer(
        { session: jane },
        { type: SYNC_SESSION_CLEARED }
      );

      expect(state).toEqual({ session: null });
    });

    it("is a no-op when already logged out", () => {
      const state = reducer({ session: null }, { type: SYNC_SESSION_CLEARED });

      expect(state).toEqual({ session: null });
    });
  });

  describe("unknown actions", () => {
    it("returns the current state untouched", () => {
      const current: SyncManagerState = { session: jane };

      expect(reducer(current, anyAction)).toBe(current);
    });

    it("does not re-read localStorage for an already-initialised state", () => {
      storeSession(jane);

      // State is already initialised as logged out, so the stored session
      // must not leak back in — hydration happens only on default state.
      expect(reducer({ session: null }, anyAction)).toEqual({ session: null });
    });
  });
});
