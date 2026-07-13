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
  mergeCategories,
  mergeSnapshotForUpload,
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

// Writes a merged snapshot to localStorage and refreshes the live Redux
// tree from it, exactly like a completed restore does.
const commitMergedLocally = async (dispatch: Dispatch, merged: BackupData) => {
  await storage.importData(merged);
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
};

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
        // The snapshot this member would upload: local data + category
        // union (AC-3.10) + every remote-only item retained (AC-3.9, D5).
        // We adopt `withCategories` locally; the UPLOAD additionally unions
        // in remote-only items (e.g. items this member rejected) so they
        // stay in the party backup instead of being wholesale-dropped.
        // Deviates from RFC §4.3's literal "PUT merged local snapshot"
        // wording by unioning categories and remote items.
        const withCategories: BackupData = {
          ...localData,
          categories: mergeCategories({
            localCategories: localData.categories,
            remoteCategories: remoteData.categories,
            buckets: localData.buckets,
          }),
        };
        const uploadSnapshot = mergeSnapshotForUpload({
          base: withCategories,
          remoteData,
        });
        // Upload only when it would actually change the backup. If the
        // upload snapshot already content-equals the remote, this member's
        // local data adds nothing new — the only differences are remote
        // items this member rejected — so we're up to date with NO upload.
        // This is what lets a rejecting member converge (AC-3.3/D5): their
        // local permanently lacks the rejected item, yet they must stop
        // re-uploading. (Subsumes the old local≡remote no-upload case.)
        if (snapshotsContentEqual(uploadSnapshot, remoteData)) {
          return { type: "up-to-date" };
        }
        try {
          const { version } = await syncApi.putBackup({
            token,
            baseVersion: downloaded.version,
            envelope: buildBackupEnvelope(uploadSnapshot) as BackupEnvelope,
          });
          // Adopt any newly received categories locally (commit happens
          // only here, after the upload's 200). We commit `withCategories`,
          // NOT the upload union — rejected remote items must never merge
          // into this device's data (AC-3.9).
          if (
            withCategories.categories.length !== localData.categories.length ||
            withCategories.categories.some(
              (name, index) => name !== localData.categories[index]
            )
          ) {
            await commitMergedLocally(dispatch, withCategories);
          }
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
            remoteData,
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
    // survive; the accepted items still apply cleanly by itemKey. `merged`
    // is what we COMMIT locally: local data + accepted/modified items only,
    // never rejected ones (AC-3.9).
    const localData: BackupData = await storage.exportData();
    const merged = applyItems(localData, acceptedItems);
    // Categories + entries/fixed/buckets travel alongside from the SAME
    // download (AC-3.10, D5). Categories: additive union excluding names
    // the merged snapshot now holds as buckets.
    const remoteData: BackupData =
      getState().syncManager.pendingReview?.remoteData || {
        balance: [],
        buckets: {},
        categories: [],
        fixedEntries: [],
      };
    merged.categories = mergeCategories({
      localCategories: merged.categories,
      remoteCategories: remoteData.categories,
      buckets: merged.buckets,
    });

    // The UPLOAD additionally unions in every remote item absent from
    // `merged` — a rejected item (or one rejected in a prior sync) — so it
    // stays in the party backup rather than being wholesale-dropped
    // (AC-3.9, D5). Accepted/modified items win because their itemKey is
    // already in `merged` (EC-5). This union is NOT committed locally.
    const uploadSnapshot = mergeSnapshotForUpload({
      base: merged,
      remoteData,
    });

    const { version } = await syncApi.putBackup({
      token: session.token,
      baseVersion,
      envelope: buildBackupEnvelope(uploadSnapshot) as BackupEnvelope,
    });

    // Commit — the only write to app localStorage in the whole flow.
    await commitMergedLocally(dispatch, merged);
    const syncState = getSyncState(party.id);
    const rejections: Rejections = { ...syncState.rejections };
    rejectedItems.forEach(({ key, hash }) => {
      const existing = rejections[key] || [];
      if (existing.indexOf(hash) === -1) rejections[key] = [...existing, hash];
    });
    commitSyncState(party.id, version, rejections);
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
