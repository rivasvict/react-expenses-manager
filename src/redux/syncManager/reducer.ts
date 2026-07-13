// Sync/account state (RFC §1): a new slice, deliberately separate from the
// dormant userManager (which targets the defunct expenses-manager-api).
import { getSession, SyncSession } from "../../services/session";
import { Party } from "../../services/syncApi/contract";
import { IncomingItem } from "../../helpers/syncMergeHelper/syncMergeHelper";
import {
  SYNC_CARD_NOTICE_SET,
  SYNC_PARTY_SET,
  SYNC_PENDING_REVIEW_SET,
  SYNC_SESSION_CLEARED,
  SYNC_SESSION_SET,
} from "./actions";

// The diffed items and the version of the exact download they came from
// (RFC §4.3): the wizard consumes THIS set — it never re-downloads, so
// decisions always bind to what the user was shown.
export interface PendingReview {
  items: IncomingItem[];
  baseVersion: string;
  // Categories travel alongside (AC-3.10): the remote list from the same
  // download, merged as an additive union at commit time.
  remoteCategories: string[];
}

// One-shot notice carried back to the Data Management card after a
// navigation: a blocked/canceled rejection discovered mid-review
// (DESIGN 4.3.4 → 4.2) or a connection failure during "Sync again".
export type SyncCardNotice = "blocked" | "canceled" | "connection";

export interface SyncManagerState {
  session: SyncSession | null;
  // Party membership is never cached as authoritative (RFC §2.2): it is
  // null until a GET /me (or party action) response fills it in.
  party: Party | null;
  // False until the first /me refresh resolves, so screens can tell
  // "no party" apart from "not loaded yet".
  partyLoaded: boolean;
  // Incoming changes staged for /sync-review; null when nothing pending.
  pendingReview: PendingReview | null;
  cardNotice: SyncCardNotice | null;
}

interface SyncAction {
  type: string;
  payload?: {
    session?: SyncSession;
    party?: Party | null;
    pendingReview?: PendingReview | null;
    cardNotice?: SyncCardNotice | null;
  };
}

// The persisted session is the source of truth (sync.session present ⇔
// logged in), so the slice hydrates from it — that is what makes a login
// survive reloads (AC-1.3).
const getDefaultState = (): SyncManagerState => ({
  session: getSession(),
  party: null,
  partyLoaded: false,
  pendingReview: null,
  cardNotice: null,
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
        pendingReview: null,
        cardNotice: null,
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
        pendingReview: action.payload?.pendingReview ?? null,
      };
    case SYNC_CARD_NOTICE_SET:
      return {
        ...currentState,
        cardNotice: action.payload?.cardNotice ?? null,
      };
    default:
      return currentState;
  }
};
