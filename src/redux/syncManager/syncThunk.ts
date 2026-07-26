// The manual sync flow (RFC §4.3): download → diff → either "up to date"
// (with a silent upload when only local additions exist), the EC-1
// first-sync upload, or staging the diffed items for /sync-review. The
// wizard consumes the items and baseVersion from the SAME download this
// thunk performed — it never re-downloads, so decisions always bind to
// exactly what the user was shown.
//
// Writes (localStorage app data + sync.state) happen ONLY when an upload
// returns 200 (RFC §4.3 step 6); every failure or abandonment path leaves
// this device completely untouched (AC-3.11).
import { Dispatch } from "redux";
import * as syncApi from "../../services/syncApi";
import { getSession } from "../../services/session";
import { getSyncState, setSyncState } from "../../services/syncState";
import {
  applyItems,
  diffSnapshots,
  snapshotsContentEqual,
  IncomingItem,
  Rejections,
  SyncItem,
} from "../../helpers/syncMergeHelper/syncMergeHelper";
import {
  BackupData,
  BackupEnvelope,
  SYNC_ERROR_CODES,
  isSyncApiError,
} from "../../services/syncApi/contract";
import {
  buildBackupEnvelope,
  parseBackupEnvelope,
} from "../../helpers/backupHelper/backupHelper";
import { RESTORE_BACKUP } from "../expensesManager/actions";
import { getGroupedFilledEntriesByDate } from "../../helpers/entriesHelper/entriesHelper";
import storageSelector from "../../services/storageSelector";
import { STORAGE_TYPES } from "../../constants";
import { SYNC_PENDING_REVIEW_SET } from "./actions";

// App data stays on local storage (RFC §1) — sync reads the same snapshot
// the backup feature exports.
const storage = storageSelector(STORAGE_TYPES.LOCAL)();

export type SyncOutcome =
  | { type: "first-sync" }
  | { type: "up-to-date" }
  | { type: "review"; incomingCount: number };

const commitSyncState = (
  partyId: string,
  version: string,
  rejections: Rejections
) => {
  setSyncState({
    partyId,
    lastSyncedVersion: version,
    lastSyncedAt: Date.now(),
    rejections,
  });
};

const isVersionConflict = (error: unknown) =>
  isSyncApiError(error) && error.code === SYNC_ERROR_CODES.VERSION_CONFLICT;

export const syncWithParty =
  () =>
  async (dispatch: Dispatch, getState: () => any): Promise<SyncOutcome> => {
    const session = getSession();
    const party = getState().syncManager.party;
    if (!session || !party) throw new Error("Sync requires a party");
    const token = session.token;

    // RFC §4.3 step 3's "on 409 → restart from step 1": one restart —
    // a second consecutive conflict surfaces to the card.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const isLastAttempt = attempt === 1;

      // Step 1 — download.
      let downloaded: { version: string; envelope: BackupEnvelope } | null;
      try {
        downloaded = await syncApi.getBackup({ token });
      } catch (downloadError) {
        if (
          isSyncApiError(downloadError) &&
          downloadError.code === SYNC_ERROR_CODES.NO_BACKUP
        ) {
          downloaded = null; // EC-1
        } else {
          throw downloadError; // blocked/canceled/network → card banners
        }
      }

      const localData: BackupData = await storage.exportData();
      const syncState = getSyncState(party.id);

      // EC-1 — no remote backup yet: upload the local snapshot as the
      // party's starting point. Wizard skipped, never an error.
      if (downloaded === null) {
        try {
          const { version } = await syncApi.putBackup({
            token,
            baseVersion: null,
            envelope: buildBackupEnvelope(localData) as BackupEnvelope,
          });
          commitSyncState(party.id, version, syncState.rejections);
          return { type: "first-sync" };
        } catch (uploadError) {
          // Another member EC-1'd first — restart with their backup.
          if (isVersionConflict(uploadError) && !isLastAttempt) continue;
          throw uploadError;
        }
      }

      // Step 2 — validate (reusing the backup parser) and diff.
      const remoteData = parseBackupEnvelope(
        JSON.stringify(downloaded.envelope)
      );
      const incoming = diffSnapshots({
        localData,
        remoteData,
        rejections: syncState.rejections,
      });

      // Step 3 — nothing incoming.
      if (incoming.length === 0) {
        if (snapshotsContentEqual(localData, remoteData)) {
          return { type: "up-to-date" }; // AC-3.3 — no upload
        }
        // Local-only additions: silent upload of the local snapshot.
        try {
          const { version } = await syncApi.putBackup({
            token,
            baseVersion: downloaded.version,
            envelope: buildBackupEnvelope(localData) as BackupEnvelope,
          });
          commitSyncState(party.id, version, syncState.rejections);
          return { type: "up-to-date" };
        } catch (uploadError) {
          if (isVersionConflict(uploadError) && !isLastAttempt) continue;
          throw uploadError;
        }
      }

      // Step 4 — incoming changes: stage the diffed items together with
      // the version of this exact download for /sync-review. All review
      // decisions stay in the wizard's memory; localStorage is untouched.
      dispatch({
        type: SYNC_PENDING_REVIEW_SET,
        payload: {
          pendingReview: {
            items: incoming as IncomingItem[],
            baseVersion: downloaded.version,
          },
        },
      });
      return { type: "review", incomingCount: incoming.length };
    }
    // Unreachable: the last attempt either returned or threw.
    throw new Error("Sync did not settle");
  };

// RFC §4.3 steps 5–6 — the review completed: build the merged snapshot in
// memory (fresh local data + every accepted item, including modified
// values, EC-5), upload it under the review's baseVersion, and only on 200
// commit everything at once: write the merged data to localStorage, record
// the rejections (the permanent AC-3.9 memory — only now, so abandoned
// reviews leave no trace), update sync.state and refresh the Redux tree.
// Any failure (409/403/410/network) is re-thrown with nothing written.
export const completeReview =
  ({
    acceptedItems,
    rejectedItems,
    baseVersion,
  }: {
    acceptedItems: SyncItem[];
    rejectedItems: { key: string; hash: string }[];
    baseVersion: string;
  }) =>
  async (dispatch: Dispatch, getState: () => any): Promise<void> => {
    const session = getSession();
    const party = getState().syncManager.party;
    if (!session || !party) throw new Error("Sync requires a party");

    // Local data is re-read at commit time so entries added mid-review
    // survive; the accepted items still apply cleanly by itemKey.
    const localData: BackupData = await storage.exportData();
    const merged = applyItems(localData, acceptedItems);

    const { version } = await syncApi.putBackup({
      token: session.token,
      baseVersion,
      envelope: buildBackupEnvelope(merged) as BackupEnvelope,
    });

    // Commit — the only write to app localStorage in the whole flow.
    await storage.importData(merged);
    const syncState = getSyncState(party.id);
    const rejections: Rejections = { ...syncState.rejections };
    rejectedItems.forEach(({ key, hash }) => {
      const existing = rejections[key] || [];
      if (existing.indexOf(hash) === -1) rejections[key] = [...existing, hash];
    });
    commitSyncState(party.id, version, rejections);

    // Refresh the live Redux tree from the merged snapshot, exactly like
    // a completed restore does.
    const entries = getGroupedFilledEntriesByDate()(
      merged.balance,
      merged.fixedEntries
    );
    dispatch({
      type: RESTORE_BACKUP,
      payload: {
        entries,
        buckets: merged.buckets,
        unbudgetedCategories: merged.categories,
        fixedEntries: merged.fixedEntries,
      },
    });
    dispatch({
      type: SYNC_PENDING_REVIEW_SET,
      payload: { pendingReview: null },
    });
  };

export const clearPendingReview =
  () =>
  (dispatch: Dispatch): void => {
    dispatch({
      type: SYNC_PENDING_REVIEW_SET,
      payload: { pendingReview: null },
    });
  };
