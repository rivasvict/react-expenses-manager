// Sync/account state (RFC §1): a new slice, deliberately separate from the
// dormant userManager (which targets the defunct expenses-manager-api).
import { getSession, SyncSession } from "../../services/session";
import { SYNC_SESSION_CLEARED, SYNC_SESSION_SET } from "./actions";

export interface SyncManagerState {
  session: SyncSession | null;
}

interface SyncAction {
  type: string;
  payload?: { session?: SyncSession };
}

// The persisted session is the source of truth (sync.session present ⇔
// logged in), so the slice hydrates from it — that is what makes a login
// survive reloads (AC-1.3).
const getDefaultState = (): SyncManagerState => ({
  session: getSession(),
});

export const reducer = (
  state: SyncManagerState | undefined,
  action: SyncAction
): SyncManagerState => {
  const currentState = state === undefined ? getDefaultState() : state;
  switch (action.type) {
    case SYNC_SESSION_SET:
      return { ...currentState, session: action.payload?.session || null };
    case SYNC_SESSION_CLEARED:
      return { ...currentState, session: null };
    default:
      return currentState;
  }
};
