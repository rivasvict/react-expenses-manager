// The manual sync flow (RFC §4.3), no-wizard paths: download → diff →
// either "up to date" (with a silent upload when only local additions
// exist), the EC-1 first-sync upload, or routing to /sync-review when
// there are incoming changes (the wizard itself is the next PR — nothing
// is ever applied unreviewed).
//
// The commit (sync.state write) happens ONLY on an upload 200 (RFC §4.3
// step 6); every failure path leaves localStorage completely untouched
// (AC-3.11).
import { Dispatch } from "redux";
import * as syncApi from "../../services/syncApi";
import { getSession } from "../../services/session";
import { getSyncState, setSyncState } from "../../services/syncState";
import {
  diffSnapshots,
  snapshotsContentEqual,
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
import storageSelector from "../../services/storageSelector";
import { STORAGE_TYPES } from "../../constants";
import { Rejections } from "../../helpers/syncMergeHelper/syncMergeHelper";
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

      // Step 4 — incoming changes: route to the review screen. All
      // decisions stay staged there; localStorage is untouched here.
      dispatch({
        type: SYNC_PENDING_REVIEW_SET,
        payload: { pendingReviewCount: incoming.length },
      });
      return { type: "review", incomingCount: incoming.length };
    }
    // Unreachable: the last attempt either returned or threw.
    throw new Error("Sync did not settle");
  };

export const clearPendingReview =
  () =>
  (dispatch: Dispatch): void => {
    dispatch({
      type: SYNC_PENDING_REVIEW_SET,
      payload: { pendingReviewCount: null },
    });
  };
