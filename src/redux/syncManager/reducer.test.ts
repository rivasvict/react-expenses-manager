import { reducer, PendingReview, SyncManagerState } from "./reducer";
import {
  SYNC_DECLINED_SET,
  SYNC_PARTY_SET,
  SYNC_PENDING_REVIEW_SET,
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

// The slice's fields move together often enough that spelling all of them
// out at every call site would bury what each test is actually about.
const loggedOut = (): SyncManagerState => ({
  session: null,
  party: null,
  partyStatusResolved: false,
  pendingReview: null,
  declined: null,
});

// A staged review as the sync thunk leaves it (RFC §4.3 step 4): the diffed
// items plus the version of the exact download they came from.
const stagedReview = (itemCount = 1): PendingReview => ({
  baseVersion: "3",
  items: Array.from({ length: itemCount }, (_, index) => ({
    key: `entry:e${index + 1}`,
    hash: `hash-${index + 1}`,
    kind: "entry",
    isChange: false,
    entry: { id: `e${index + 1}`, amount: "10", type: "expense" },
  })),
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

    it("drops a pending review along with the session", () => {
      const state = reducer(
        loggedIn(jane, {
          party: janesParty,
          partyStatusResolved: true,
          pendingReview: stagedReview(3),
        }),
        { type: SYNC_SESSION_CLEARED }
      );

      // A review belongs to the party it was downloaded from; whoever signs
      // in next must not inherit its items.
      expect(state.pendingReview).toBeNull();
    });

    it("drops a mid-review declined reason along with the session", () => {
      const state = reducer(
        loggedIn(jane, { party: janesParty, partyStatusResolved: true, declined: "blocked" }),
        { type: SYNC_SESSION_CLEARED }
      );

      expect(state.declined).toBeNull();
    });
  });

  describe("SYNC_PENDING_REVIEW_SET", () => {
    it("stages the diffed items and their baseVersion for the review wizard", () => {
      const review = stagedReview(2);
      const state = reducer(loggedIn(jane, { party: janesParty }), {
        type: SYNC_PENDING_REVIEW_SET,
        payload: { pendingReview: review },
      });

      expect(state.pendingReview).toEqual(review);
    });

    it("clears the review when the payload carries null (review abandoned)", () => {
      const state = reducer(loggedIn(jane, { pendingReview: stagedReview(2) }), {
        type: SYNC_PENDING_REVIEW_SET,
        payload: { pendingReview: null },
      });

      expect(state.pendingReview).toBeNull();
    });

    it("treats a missing review as no pending review", () => {
      const state = reducer(loggedIn(jane, { pendingReview: stagedReview(2) }), {
        type: SYNC_PENDING_REVIEW_SET,
      });

      expect(state.pendingReview).toBeNull();
    });

    it("leaves the session and party alone", () => {
      const state = reducer(
        loggedIn(jane, { party: janesParty, partyStatusResolved: true }),
        { type: SYNC_PENDING_REVIEW_SET, payload: { pendingReview: stagedReview() } }
      );

      expect(state.session).toEqual(jane);
      expect(state.party).toEqual(janesParty);
      expect(state.partyStatusResolved).toBe(true);
    });
  });

  describe("SYNC_DECLINED_SET", () => {
    it("records why an upload was declined mid-review, for the sync card's banner", () => {
      const state = reducer(loggedIn(jane, { party: janesParty }), {
        type: SYNC_DECLINED_SET,
        payload: { declined: "canceled" },
      });

      expect(state.declined).toBe("canceled");
    });

    it("clears the reason once the banner has been shown", () => {
      const state = reducer(loggedIn(jane, { declined: "blocked" }), {
        type: SYNC_DECLINED_SET,
        payload: { declined: null },
      });

      expect(state.declined).toBeNull();
    });

    it("leaves the staged review alone", () => {
      const review = stagedReview();
      const state = reducer(loggedIn(jane, { pendingReview: review }), {
        type: SYNC_DECLINED_SET,
        payload: { declined: "blocked" },
      });

      expect(state.pendingReview).toEqual(review);
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
