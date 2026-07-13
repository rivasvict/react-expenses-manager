// Sync/account state (RFC §1): a new slice, deliberately separate from the
// dormant userManager (which targets the defunct expenses-manager-api).
import { getSession, SyncSession } from "../../services/session";
import { Party } from "../../services/syncApi/contract";
import {
  SYNC_PARTY_SET,
  SYNC_PENDING_REVIEW_SET,
  SYNC_SESSION_CLEARED,
  SYNC_SESSION_SET,
} from "./actions";

export interface SyncManagerState {
  session: SyncSession | null;
  // Party membership is never cached as authoritative (RFC §2.2): it is
  // null until a GET /me (or party action) response fills it in.
  party: Party | null;
  // False until the first /me refresh resolves, so screens can tell
  // "no party" apart from "not loaded yet".
  partyLoaded: boolean;
  // Incoming-change count for the /sync-review screen; null when no
  // review is pending. The full staged item set arrives with the wizard
  // PR — nothing is ever applied unreviewed.
  pendingReviewCount: number | null;
}

interface SyncAction {
  type: string;
  payload?: {
    session?: SyncSession;
    party?: Party | null;
    pendingReviewCount?: number | null;
  };
}

// The persisted session is the source of truth (sync.session present ⇔
// logged in), so the slice hydrates from it — that is what makes a login
// survive reloads (AC-1.3).
const getDefaultState = (): SyncManagerState => ({
  session: getSession(),
  party: null,
  partyLoaded: false,
  pendingReviewCount: null,
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
      // Logging out (or a dead token) also drops the cached party.
      return {
        ...currentState,
        session: null,
        party: null,
        partyLoaded: false,
        pendingReviewCount: null,
      };
    case SYNC_PARTY_SET:
      return {
        ...currentState,
        party: action.payload?.party || null,
        partyLoaded: true,
      };
    case SYNC_PENDING_REVIEW_SET:
      return {
        ...currentState,
        pendingReviewCount: action.payload?.pendingReviewCount ?? null,
      };
    default:
      return currentState;
  }
};
