import * as syncApi from "../../services/syncApi";
import { setSession, SyncSession } from "../../services/session";
import {
  getSyncState,
  setSyncState,
  SYNC_STATE_STORAGE_KEY,
} from "../../services/syncState";
import {
  Party,
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "../../services/syncApi/contract";
import { contentHash } from "../../helpers/syncMergeHelper/syncMergeHelper";
import { SYNC_PENDING_REVIEW_SET } from "./actions";
import { clearPendingReview, syncWithParty } from "./syncThunk";

/**
 * Unit tests for the no-wizard sync flow (docs/multi-user-sync/RFC.md §4.3).
 * The HTTP client and the local snapshot are mocked, so these pin the
 * decision logic: which outcome each download/diff combination produces,
 * exactly what is uploaded with which baseVersion, and that sync.state is
 * written only when an upload succeeded (AC-3.11, docs/multi-user-sync/PRD.md).
 */

jest.mock("../../services/syncApi", () => ({
  getBackup: jest.fn(),
  putBackup: jest.fn(),
}));

// The thunk builds its storage at module load, before this file's
// top-level code runs, so the stub must reach the mock lazily (per call).
const mockExportData = jest.fn();
jest.mock("../../services/storageSelector", () => () => () => ({
  exportData: () => mockExportData(),
}));

const getBackupMock = syncApi.getBackup as unknown as jest.Mock;
const putBackupMock = syncApi.putBackup as unknown as jest.Mock;

const jane: SyncSession = {
  token: "token-for-jane",
  user: { id: "u1", email: "jane@example.com", firstName: "Jane", lastName: "Doe" },
};

const janesParty: Party = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: "u1",
  canceled: false,
  youAreBlocked: false,
  members: [],
};

const groceries = {
  id: "e1",
  date: 1747310400000,
  amount: "75",
  description: "Groceries",
  type: "expense",
  categories_path: ",groceries,",
};
const cinema = {
  id: "e2",
  date: 1747396800000,
  amount: "42.1",
  description: "Cinema",
  type: "expense",
  categories_path: ",eating out,",
};

const snapshot = (balance: unknown[] = []) => ({
  balance,
  buckets: {},
  categories: [],
  fixedEntries: [],
});

const envelope = (balance: unknown[] = []) => ({
  app: "react-expenses-manager",
  schemaVersion: 1,
  exportedAt: "2026-05-14T12:00:00.000Z",
  data: snapshot(balance),
});

const noBackup = () =>
  createSyncApiError({
    code: SYNC_ERROR_CODES.NO_BACKUP,
    message: "No backup has been uploaded yet.",
    status: 404,
  });
const versionConflict = () =>
  createSyncApiError({
    code: SYNC_ERROR_CODES.VERSION_CONFLICT,
    message: "The party backup changed since your download.",
    status: 409,
  });

// Runs the thunk against a fake store holding the given party.
const run = (party: Party | null = janesParty) => {
  const dispatch = jest.fn();
  const getState = () => ({ syncManager: { party } });
  return {
    dispatch,
    result: syncWithParty()(dispatch, getState),
  };
};

const storedSyncState = () =>
  window.localStorage.getItem(SYNC_STATE_STORAGE_KEY);

beforeEach(() => {
  window.localStorage.clear();
  getBackupMock.mockReset();
  putBackupMock.mockReset();
  mockExportData.mockReset();
  mockExportData.mockResolvedValue(snapshot([groceries]));
  setSession(jane);
});

describe("syncWithParty", () => {
  it("refuses to run without a session", async () => {
    window.localStorage.clear();

    await expect(run().result).rejects.toThrow("Sync requires a party");
    expect(getBackupMock).not.toHaveBeenCalled();
  });

  it("refuses to run without a party", async () => {
    await expect(run(null).result).rejects.toThrow("Sync requires a party");
    expect(getBackupMock).not.toHaveBeenCalled();
  });

  it("EC-1: no remote backup → create-only upload of the local snapshot", async () => {
    getBackupMock.mockRejectedValue(noBackup());
    putBackupMock.mockResolvedValue({ version: "1" });

    const { result } = run();

    await expect(result).resolves.toEqual({ type: "first-sync" });
    expect(getBackupMock).toHaveBeenCalledWith({ token: jane.token });
    expect(putBackupMock).toHaveBeenCalledTimes(1);
    const upload = putBackupMock.mock.calls[0][0];
    expect(upload.token).toBe(jane.token);
    expect(upload.baseVersion).toBeNull();
    expect(upload.envelope.app).toBe("react-expenses-manager");
    expect(upload.envelope.data).toEqual(snapshot([groceries]));
    // Committed: the party's state now points at the version just written.
    expect(getSyncState(janesParty.id)).toMatchObject({
      lastSyncedVersion: "1",
      rejections: {},
    });
    expect(getSyncState(janesParty.id).lastSyncedAt).not.toBeNull();
  });

  it("identical snapshots → up to date, with no upload and no state written (AC-3.3)", async () => {
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: envelope([groceries]),
    });

    await expect(run().result).resolves.toEqual({ type: "up-to-date" });

    expect(putBackupMock).not.toHaveBeenCalled();
    expect(storedSyncState()).toBeNull();
  });

  it("treats entry order as irrelevant when comparing snapshots", async () => {
    mockExportData.mockResolvedValue(snapshot([cinema, groceries]));
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: envelope([groceries, cinema]),
    });

    await expect(run().result).resolves.toEqual({ type: "up-to-date" });
    expect(putBackupMock).not.toHaveBeenCalled();
  });

  it("local-only additions → silent upload on the downloaded version, then up to date", async () => {
    mockExportData.mockResolvedValue(snapshot([groceries, cinema]));
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: envelope([groceries]),
    });
    putBackupMock.mockResolvedValue({ version: "4" });

    await expect(run().result).resolves.toEqual({ type: "up-to-date" });

    const upload = putBackupMock.mock.calls[0][0];
    expect(upload.baseVersion).toBe("3");
    expect(upload.envelope.data).toEqual(snapshot([groceries, cinema]));
    expect(getSyncState(janesParty.id).lastSyncedVersion).toBe("4");
  });

  it("incoming changes → routes to review, uploads nothing, writes nothing", async () => {
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: envelope([groceries, cinema]),
    });

    const { dispatch, result } = run();

    await expect(result).resolves.toEqual({
      type: "review",
      incomingCount: 1,
    });
    expect(dispatch).toHaveBeenCalledWith({
      type: SYNC_PENDING_REVIEW_SET,
      payload: { pendingReviewCount: 1 },
    });
    expect(putBackupMock).not.toHaveBeenCalled();
    // Nothing is applied or remembered until the review completes.
    expect(storedSyncState()).toBeNull();
  });

  it("an edit to an existing entry by another member counts as incoming", async () => {
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: envelope([{ ...groceries, amount: "80" }]),
    });

    await expect(run().result).resolves.toEqual({
      type: "review",
      incomingCount: 1,
    });
  });

  it("previously rejected items are skipped and the rejections survive the commit (AC-3.9)", async () => {
    // Jane rejected Tom's cinema entry in an earlier review.
    const rejections = {
      "entry:e2": [contentHash({ ...cinema, id: undefined })],
    };
    setSyncState({
      partyId: janesParty.id,
      lastSyncedVersion: "2",
      lastSyncedAt: 1,
      rejections,
    });
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: envelope([groceries, cinema]),
    });
    putBackupMock.mockResolvedValue({ version: "4" });

    // With the rejection filtered out nothing is incoming; the snapshots
    // still differ (remote has the rejected entry), so the local one is
    // re-uploaded silently — without the rejected item.
    await expect(run().result).resolves.toEqual({ type: "up-to-date" });

    expect(putBackupMock.mock.calls[0][0].envelope.data.balance).toEqual([
      groceries,
    ]);
    expect(getSyncState(janesParty.id)).toMatchObject({
      lastSyncedVersion: "4",
      rejections,
    });
  });

  it("sync state from another party is ignored, not carried over", async () => {
    setSyncState({
      partyId: "party-old",
      lastSyncedVersion: "9",
      lastSyncedAt: 1,
      rejections: { "entry:e2": ["stale-hash"] },
    });
    getBackupMock.mockRejectedValue(noBackup());
    putBackupMock.mockResolvedValue({ version: "1" });

    await run().result;

    expect(getSyncState(janesParty.id)).toMatchObject({
      partyId: janesParty.id,
      lastSyncedVersion: "1",
      rejections: {},
    });
  });

  it("a single VERSION_CONFLICT restarts from a fresh download (EC-2 restart rule)", async () => {
    // First round: EC-1 upload loses to another member's first sync.
    // Second round: their backup is identical to ours → up to date.
    getBackupMock
      .mockRejectedValueOnce(noBackup())
      .mockResolvedValueOnce({ version: "1", envelope: envelope([groceries]) });
    putBackupMock.mockRejectedValueOnce(versionConflict());

    await expect(run().result).resolves.toEqual({ type: "up-to-date" });

    expect(getBackupMock).toHaveBeenCalledTimes(2);
    expect(putBackupMock).toHaveBeenCalledTimes(1);
    // The refused upload committed nothing.
    expect(storedSyncState()).toBeNull();
  });

  it("two consecutive VERSION_CONFLICTs surface the conflict to the caller", async () => {
    mockExportData.mockResolvedValue(snapshot([groceries, cinema]));
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: envelope([groceries]),
    });
    putBackupMock.mockRejectedValue(versionConflict());

    await expect(run().result).rejects.toMatchObject({
      code: SYNC_ERROR_CODES.VERSION_CONFLICT,
    });

    expect(putBackupMock).toHaveBeenCalledTimes(2);
    expect(storedSyncState()).toBeNull();
  });

  it("a download failure other than NO_BACKUP is re-thrown before any upload (AC-3.11)", async () => {
    getBackupMock.mockRejectedValue(
      createSyncApiError({
        code: SYNC_ERROR_CODES.BLOCKED,
        message: "You've been removed from this party by its organizer.",
        status: 403,
      })
    );

    await expect(run().result).rejects.toMatchObject({
      code: SYNC_ERROR_CODES.BLOCKED,
    });

    expect(putBackupMock).not.toHaveBeenCalled();
    expect(storedSyncState()).toBeNull();
  });

  it("an upload failure other than a conflict is re-thrown and commits nothing", async () => {
    getBackupMock.mockRejectedValue(noBackup());
    putBackupMock.mockRejectedValue(
      createSyncApiError({
        code: SYNC_ERROR_CODES.NETWORK_ERROR,
        message: "Couldn't reach the sync server. Please try again.",
      })
    );

    await expect(run().result).rejects.toMatchObject({
      code: SYNC_ERROR_CODES.NETWORK_ERROR,
    });

    expect(putBackupMock).toHaveBeenCalledTimes(1);
    expect(storedSyncState()).toBeNull();
  });
});

describe("clearPendingReview", () => {
  it("dispatches a null pending-review count", () => {
    const dispatch = jest.fn();

    clearPendingReview()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: SYNC_PENDING_REVIEW_SET,
      payload: { pendingReviewCount: null },
    });
  });
});
