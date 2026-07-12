// Persisted sync metadata (RFC §2.2): localStorage key "sync.state".
// `rejections` is the permanent AC-3.9 memory; the whole record is written
// ONLY when an upload completes with 200 (RFC §4.3 step 6) — abandoned
// reviews and failed uploads leave no trace. The state is scoped to a
// party: reading it for a different party returns a fresh record.
import { Rejections } from "../helpers/syncMergeHelper/syncMergeHelper";

export const SYNC_STATE_STORAGE_KEY = "sync.state";

export interface SyncState {
  partyId: string;
  lastSyncedVersion: string | null;
  lastSyncedAt: number | null;
  rejections: Rejections;
}

const freshState = (partyId: string): SyncState => ({
  partyId,
  lastSyncedVersion: null,
  lastSyncedAt: null,
  rejections: {},
});

export const getSyncState = (partyId: string): SyncState => {
  const raw = window.localStorage.getItem(SYNC_STATE_STORAGE_KEY);
  if (!raw) return freshState(partyId);
  try {
    const state: SyncState = JSON.parse(raw);
    if (!state || state.partyId !== partyId) return freshState(partyId);
    return { ...freshState(partyId), ...state };
  } catch (error) {
    return freshState(partyId);
  }
};

export const setSyncState = (state: SyncState): void => {
  window.localStorage.setItem(SYNC_STATE_STORAGE_KEY, JSON.stringify(state));
};
