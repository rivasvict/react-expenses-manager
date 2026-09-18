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
import {
  contentHash,
  IncomingItem,
} from "../../helpers/syncMergeHelper/syncMergeHelper";
import { RESTORE_BACKUP } from "../expensesManager/actions";
import { SYNC_PENDING_REVIEW_SET } from "./actions";
import {
  clearPendingReview,
  completeReview,
  syncWithParty,
} from "./syncThunk";

/**
 * Unit tests for the sync flow (docs/multi-user-sync/RFC.md §4.3). The HTTP
 * client and the local snapshot are mocked, so these pin the decision logic:
 * which outcome each download/diff combination produces, exactly what is
 * uploaded with which baseVersion, what a completed review commits, and
 * that sync.state and local data are written only when an upload succeeded
 * (AC-3.11, docs/multi-user-sync/PRD.md).
 */

jest.mock("../../services/syncApi", () => ({
  getBackup: jest.fn(),
  putBackup: jest.fn(),
}));

// The thunk builds its storage at module load, before this file's
// top-level code runs, so the stub must reach the mock lazily (per call).
const mockExportData = jest.fn();
const mockImportData = jest.fn();
jest.mock("../../services/storageSelector", () => () => () => ({
  exportData: () => mockExportData(),
  importData: (data: unknown) => mockImportData(data),
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
  mockImportData.mockReset();
  mockImportData.mockResolvedValue(undefined);
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
    // The wizard reviews exactly this download: the diffed items plus the
    // version they came from, so the later upload can CAS against it.
    expect(dispatch).toHaveBeenCalledWith({
      type: SYNC_PENDING_REVIEW_SET,
      payload: {
        pendingReview: {
          baseVersion: "3",
          items: [expect.objectContaining({ key: "entry:e2", kind: "entry" })],
        },
      },
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

  it("a backup whose schema this build cannot read fails as UNSUPPORTED_SCHEMA_VERSION, not a network error", async () => {
    // A member on a newer release uploaded an envelope written against a
    // schema version this build does not know (issue #170).
    getBackupMock.mockResolvedValue({
      version: "3",
      envelope: { ...envelope([groceries]), schemaVersion: 2 },
    });

    await expect(run().result).rejects.toMatchObject({
      code: SYNC_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
    });

    // Nothing uploaded, nothing committed (AC-3.11).
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

describe("completeReview (RFC §4.3 steps 5–6)", () => {
  const incomingCinema: IncomingItem = {
    key: "entry:e2",
    hash: contentHash({ ...cinema, id: undefined }),
    kind: "entry",
    isChange: false,
    entry: cinema,
  };

  const runReview = (
    {
      acceptedItems = [] as IncomingItem[],
      rejectedItems = [] as { key: string; hash: string }[],
    } = {},
    party: Party | null = janesParty
  ) => {
    const dispatch = jest.fn();
    const getState = () => ({ syncManager: { party } });
    return {
      dispatch,
      result: completeReview({ acceptedItems, rejectedItems, baseVersion: "3" })(
        dispatch,
        getState
      ),
    };
  };

  it("uploads local data plus the accepted items under the review's baseVersion", async () => {
    putBackupMock.mockResolvedValue({ version: "4" });

    await runReview({ acceptedItems: [incomingCinema] }).result;

    const upload = putBackupMock.mock.calls[0][0];
    expect(upload.baseVersion).toBe("3");
    expect(upload.envelope.data).toEqual(snapshot([groceries, cinema]));
  });

  it("on 200 commits: local data, rejection memory, sync.state and the Redux tree", async () => {
    putBackupMock.mockResolvedValue({ version: "4" });
    const rejected = { key: "entry:e3", hash: "rejected-hash" };

    const { dispatch, result } = runReview({
      acceptedItems: [incomingCinema],
      rejectedItems: [rejected],
    });
    await result;

    expect(mockImportData).toHaveBeenCalledWith(snapshot([groceries, cinema]));
    const state = getSyncState(janesParty.id);
    expect(state.lastSyncedVersion).toBe("4");
    expect(state.rejections).toEqual({ [rejected.key]: [rejected.hash] });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: RESTORE_BACKUP })
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: SYNC_PENDING_REVIEW_SET,
      payload: { pendingReview: null },
    });
  });

  it("does not duplicate an already-remembered rejection hash", async () => {
    putBackupMock.mockResolvedValue({ version: "4" });
    setSyncState({
      partyId: janesParty.id,
      lastSyncedVersion: "3",
      lastSyncedAt: 1,
      rejections: { "entry:e3": ["rejected-hash"] },
    });

    await runReview({
      rejectedItems: [{ key: "entry:e3", hash: "rejected-hash" }],
    }).result;

    expect(getSyncState(janesParty.id).rejections).toEqual({
      "entry:e3": ["rejected-hash"],
    });
  });

  it("re-reads local data at commit time so entries added mid-review survive", async () => {
    putBackupMock.mockResolvedValue({ version: "4" });
    const addedMidReview = { ...groceries, id: "e9", description: "Coffee" };
    mockExportData.mockResolvedValue(snapshot([groceries, addedMidReview]));

    await runReview({ acceptedItems: [incomingCinema] }).result;

    expect(putBackupMock.mock.calls[0][0].envelope.data).toEqual(
      snapshot([groceries, addedMidReview, cinema])
    );
  });

  it("a failed upload re-throws and writes nothing (AC-3.11)", async () => {
    putBackupMock.mockRejectedValue(versionConflict());

    const { dispatch, result } = runReview({
      acceptedItems: [incomingCinema],
      rejectedItems: [{ key: "entry:e3", hash: "rejected-hash" }],
    });

    await expect(result).rejects.toMatchObject({
      code: SYNC_ERROR_CODES.VERSION_CONFLICT,
    });
    expect(mockImportData).not.toHaveBeenCalled();
    expect(storedSyncState()).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("refuses to run without a party", async () => {
    await expect(runReview({}, null).result).rejects.toThrow(
      "Sync requires a party"
    );
    expect(putBackupMock).not.toHaveBeenCalled();
  });
});

describe("clearPendingReview", () => {
  it("dispatches a null pending review", () => {
    const dispatch = jest.fn();

    clearPendingReview()(dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: SYNC_PENDING_REVIEW_SET,
      payload: { pendingReview: null },
    });
  });
});
