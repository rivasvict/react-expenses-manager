import { reducer, SyncManagerState } from "./reducer";
import {
  SYNC_PARTY_SET,
  SYNC_SESSION_CLEARED,
  SYNC_SESSION_SET,
} from "./actions";
import { SESSION_STORAGE_KEY, SyncSession } from "../../services/session";
import { Party } from "../../services/syncApi/contract";

/**
 * Unit tests for the syncManager slice (docs/multi-user-sync/RFC.md §1).
 * The slice's defining behaviour is that its default state hydrates from the
 * persisted session, which is what makes a login survive a reload
 * (AC-1.3, docs/multi-user-sync/PRD.md). Party membership is deliberately not
 * persisted alongside it: it is never cached as authoritative (RFC §2.2), so
 * it starts empty and is filled in by a /me refresh.
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

const janesParty: Party = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: "u1",
  canceled: false,
  youAreBlocked: false,
  members: [
    {
      id: "u1",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      blocked: false,
    },
  ],
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

// The slice's three fields move together often enough that spelling all of
// them out at every call site would bury what each test is actually about.
const loggedOut = (): SyncManagerState => ({
  session: null,
  party: null,
  partyStatusResolved: false,
});

const loggedIn = (
  session: SyncSession,
  rest: Partial<SyncManagerState> = {}
): SyncManagerState => ({ ...loggedOut(), session, ...rest });

const anyAction = { type: "SOMETHING_ELSE" };

beforeEach(() => {
  window.localStorage.clear();
});

describe("syncManager reducer", () => {
  describe("default state", () => {
    it("starts logged out when nothing is stored", () => {
      expect(reducer(undefined, anyAction)).toEqual(loggedOut());
    });

    it("hydrates the stored session so a login survives a reload", () => {
      storeSession(jane);

      expect(reducer(undefined, anyAction)).toEqual(loggedIn(jane));
    });

    it("starts logged out when the stored token has already expired", () => {
      const expired = { ...jane, token: tokenExpiringAt(1) };
      storeSession(expired);

      expect(reducer(undefined, anyAction)).toEqual(loggedOut());
    });

    it("starts with the party not yet loaded, even for a stored session", () => {
      storeSession(jane);

      // "No party" and "we have not asked yet" have to be distinguishable, or
      // a returning member would be shown the create-a-party screen for as
      // long as the /me refresh takes.
      const state = reducer(undefined, anyAction);
      expect(state.party).toBeNull();
      expect(state.partyStatusResolved).toBe(false);
    });
  });

  describe("SYNC_SESSION_SET", () => {
    it("stores the session from the payload", () => {
      const state = reducer(loggedOut(), {
        type: SYNC_SESSION_SET,
        payload: { session: jane },
      });

      expect(state).toEqual(loggedIn(jane));
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

      const state = reducer(loggedIn(jane), {
        type: SYNC_SESSION_SET,
        payload: { session: bob },
      });

      expect(state.session).toEqual(bob);
    });

    it("falls back to logged out when the payload carries no session", () => {
      const state = reducer(loggedIn(jane), { type: SYNC_SESSION_SET });

      expect(state.session).toBeNull();
    });
  });

  describe("SYNC_PARTY_SET", () => {
    it("stores the party and marks it loaded", () => {
      const state = reducer(loggedIn(jane), {
        type: SYNC_PARTY_SET,
        payload: { party: janesParty },
      });

      expect(state.party).toEqual(janesParty);
      expect(state.partyStatusResolved).toBe(true);
    });

    it("records 'no party' as an answer, not as an unanswered question", () => {
      const state = reducer(loggedIn(jane), {
        type: SYNC_PARTY_SET,
        payload: { party: null },
      });

      // A /me that comes back with no party is what unlocks the create/join
      // screen, so it must set partyStatusResolved even though party stays null.
      expect(state.party).toBeNull();
      expect(state.partyStatusResolved).toBe(true);
    });

    it("replaces the previous party rather than merging into it", () => {
      const canceled = { ...janesParty, canceled: true, name: "Renamed" };

      const state = reducer(loggedIn(jane, { party: janesParty, partyStatusResolved: true }), {
        type: SYNC_PARTY_SET,
        payload: { party: canceled },
      });

      expect(state.party).toEqual(canceled);
    });

    it("leaves the session alone", () => {
      const state = reducer(loggedIn(jane), {
        type: SYNC_PARTY_SET,
        payload: { party: janesParty },
      });

      expect(state.session).toEqual(jane);
    });
  });

  describe("SYNC_SESSION_CLEARED", () => {
    it("drops the session", () => {
      const state = reducer(loggedIn(jane), { type: SYNC_SESSION_CLEARED });

      expect(state).toEqual(loggedOut());
    });

    it("drops the cached party too", () => {
      const state = reducer(
        loggedIn(jane, { party: janesParty, partyStatusResolved: true }),
        { type: SYNC_SESSION_CLEARED }
      );

      // Logging out — or having a token rejected — must not leave the
      // previous member's party on screen for whoever signs in next.
      expect(state).toEqual(loggedOut());
      expect(state.partyStatusResolved).toBe(false);
    });

    it("is a no-op when already logged out", () => {
      const state = reducer(loggedOut(), { type: SYNC_SESSION_CLEARED });

      expect(state).toEqual(loggedOut());
    });
  });

  describe("unknown actions", () => {
    it("returns the current state untouched", () => {
      const current = loggedIn(jane, { party: janesParty, partyStatusResolved: true });

      expect(reducer(current, anyAction)).toBe(current);
    });

    it("does not re-read localStorage for an already-initialised state", () => {
      storeSession(jane);

      // State is already initialised as logged out, so the stored session
      // must not leak back in — hydration happens only on default state.
      expect(reducer(loggedOut(), anyAction)).toEqual(loggedOut());
    });
  });
});
