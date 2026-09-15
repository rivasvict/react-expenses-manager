import {
  getSyncState,
  setSyncState,
  SYNC_STATE_STORAGE_KEY,
  SyncState,
} from "./syncState";

/**
 * Unit tests for the persisted sync metadata (docs/multi-user-sync/RFC.md
 * §2.2). What matters here: a party only ever sees its own record (a fresh
 * one otherwise), and anything unreadable degrades to "never synced" rather
 * than throwing — the rejection memory (AC-3.9, docs/multi-user-sync/PRD.md)
 * must survive a round-trip intact.
 */

const synced: SyncState = {
  partyId: "party-1",
  lastSyncedVersion: "3",
  lastSyncedAt: 1747310400000,
  rejections: { "entry:e1": ["abc123"], "bucket:groceries:2026-05": ["def"] },
};

const fresh = (partyId: string): SyncState => ({
  partyId,
  lastSyncedVersion: null,
  lastSyncedAt: null,
  rejections: {},
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("syncState", () => {
  it("returns a fresh record for a party that has never synced", () => {
    expect(getSyncState("party-1")).toEqual(fresh("party-1"));
  });

  it("round-trips a written record", () => {
    setSyncState(synced);

    expect(getSyncState("party-1")).toEqual(synced);
    expect(window.localStorage.getItem(SYNC_STATE_STORAGE_KEY)).not.toBeNull();
  });

  it("scopes the record to its party: another party reads a fresh one", () => {
    setSyncState(synced);

    // Leaving a party and joining another must not carry the old party's
    // version or rejections along.
    expect(getSyncState("party-2")).toEqual(fresh("party-2"));
  });

  it("fills in fields a stored record is missing", () => {
    window.localStorage.setItem(
      SYNC_STATE_STORAGE_KEY,
      JSON.stringify({ partyId: "party-1", lastSyncedVersion: "1" })
    );

    expect(getSyncState("party-1")).toEqual({
      ...fresh("party-1"),
      lastSyncedVersion: "1",
    });
  });

  it("degrades to a fresh record when the stored value is not JSON", () => {
    window.localStorage.setItem(SYNC_STATE_STORAGE_KEY, "{not json");

    expect(getSyncState("party-1")).toEqual(fresh("party-1"));
  });

  it("degrades to a fresh record when the stored value is JSON null", () => {
    window.localStorage.setItem(SYNC_STATE_STORAGE_KEY, "null");

    expect(getSyncState("party-1")).toEqual(fresh("party-1"));
  });

  it("replaces the previous record rather than merging into it", () => {
    setSyncState(synced);
    setSyncState({ ...fresh("party-1"), lastSyncedVersion: "4" });

    // Rejections are part of the record: a write without them is a write
    // of "no rejections", which is what the commit step relies on.
    expect(getSyncState("party-1")).toEqual({
      ...fresh("party-1"),
      lastSyncedVersion: "4",
    });
  });
});
