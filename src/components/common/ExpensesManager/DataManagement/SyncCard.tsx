import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button, Col } from "react-bootstrap";
import { refreshMe } from "../../../../redux/syncManager/actionCreators";
import { SYNC_CARD_NOTICE_SET } from "../../../../redux/syncManager/actions";
import { SyncCardNotice } from "../../../../redux/syncManager/reducer";
import {
  syncWithParty,
  SyncOutcome,
} from "../../../../redux/syncManager/syncThunk";
import { SyncSession } from "../../../../services/session";
import { getSyncState } from "../../../../services/syncState";
import {
  Party,
  SYNC_ERROR_CODES,
  isSyncApiError,
} from "../../../../services/syncApi/contract";
import { formatRelativeTime } from "../../../../helpers/date";

interface SyncCardProps {
  session: SyncSession | null;
  party: Party | null;
  partyLoaded: boolean;
  cardNotice: SyncCardNotice | null;
  onRefreshMe: () => Promise<boolean>;
  onSync: () => Promise<SyncOutcome>;
  onClearCardNotice: () => void;
}

// DESIGN §4.2 banner copy, keyed by outcome/error.
const COPY = {
  upToDate: "You're up to date.",
  firstSync:
    "This is the first sync for your party. Your data is now the starting point — future syncs will compare against it.",
  connectionFailed:
    "Couldn't reach your party. Check your connection and try again.",
  declinedBlocked:
    "This sync was declined: you've been removed from your party by its organizer. Nothing on this device was changed.",
  declinedCanceled:
    "This sync was declined: your party was canceled. Nothing on this device was changed.",
  conflict:
    "Your party synced new changes while you were syncing. Sync again to pick them up.",
};

// The always-rendered explanatory caption under the button (AC-2.11:
// disabled states are explained, never silently hidden). DESIGN §4.1.
const getCaption = (
  session: SyncSession | null,
  party: Party | null,
  partyLoaded: boolean,
  meCheckFailed: boolean
): { enabled: boolean; caption: string } => {
  if (!session)
    return {
      enabled: false,
      caption: "Sign in and join a party to sync your entries across devices.",
    };
  if (!partyLoaded && !party)
    return {
      enabled: false,
      caption: meCheckFailed
        ? "Couldn't check your party. It will retry when you reopen this screen."
        : "Checking your party…",
    };
  if (!party)
    return {
      enabled: false,
      caption: "Create or join a party to start syncing.",
    };
  if (party.youAreBlocked)
    return {
      enabled: false,
      caption:
        "You've been removed from your party by its organizer. Sync is unavailable.",
    };
  if (party.canceled)
    return {
      enabled: false,
      caption: "Your party was canceled. Create or join a new one to sync again.",
    };
  const { lastSyncedAt } = getSyncState(party.id);
  return {
    enabled: true,
    caption:
      lastSyncedAt === null
        ? "Never synced yet"
        : `Last synced: ${formatRelativeTime(lastSyncedAt)}`,
  };
};

/**
 * The "Sync with your party" card on Data Management (DESIGN §4.1–4.2).
 * Sync is a manual, explicit action (AC-3.1): the only network calls to
 * the backup endpoints happen inside the button's click handler.
 */
const SyncCard = ({
  session,
  party,
  partyLoaded,
  cardNotice,
  onRefreshMe,
  onSync,
  onClearCardNotice,
}: SyncCardProps) => {
  const history = useHistory();
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [alert, setAlert] = useState<string | null>(null);
  const [meCheckFailed, setMeCheckFailed] = useState(false);

  // Party state drives the gating captions; /me is refreshed on mount
  // (RFC §2.2) — this is metadata only, never a backup call. A failed
  // check flips to an honest caption instead of "Checking…" forever.
  useEffect(() => {
    if (!session) return;
    onRefreshMe().then((succeeded) => {
      if (!succeeded) setMeCheckFailed(true);
    });
  }, [session, onRefreshMe]);

  // A one-shot notice carried back from the review wizard (DESIGN 4.3.4)
  // lands here as the same §4.2 banner a direct sync would have shown:
  // blocked/canceled rejections, or a connection failure during
  // "Sync again".
  useEffect(() => {
    if (!cardNotice) return;
    setAlert(
      cardNotice === "blocked"
        ? COPY.declinedBlocked
        : cardNotice === "canceled"
          ? COPY.declinedCanceled
          : COPY.connectionFailed
    );
    onClearCardNotice();
  }, [cardNotice, onClearCardNotice]);

  const { enabled, caption } = getCaption(
    session,
    party,
    partyLoaded,
    meCheckFailed
  );

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus(null);
    setAlert(null);
    try {
      const outcome = await onSync();
      if (outcome.type === "review") {
        // Navigating away unmounts this card — no state updates after
        // this point (a `finally` here would fire one on the unmounted
        // component).
        history.push("/sync-review");
        return;
      }
      setStatus(
        outcome.type === "first-sync" ? COPY.firstSync : COPY.upToDate
      );
      setIsSyncing(false);
    } catch (syncError) {
      if (isSyncApiError(syncError)) {
        if (syncError.code === SYNC_ERROR_CODES.BLOCKED) {
          // EC-9/stale state: distinct banner + card re-render into the
          // matching disabled state (via the /me refresh below).
          setAlert(COPY.declinedBlocked);
          onRefreshMe();
        } else if (syncError.code === SYNC_ERROR_CODES.PARTY_CANCELED) {
          setAlert(COPY.declinedCanceled);
          onRefreshMe();
        } else if (syncError.code === SYNC_ERROR_CODES.VERSION_CONFLICT) {
          setAlert(COPY.conflict);
        } else if (syncError.code === SYNC_ERROR_CODES.NETWORK_ERROR) {
          setAlert(COPY.connectionFailed);
        } else {
          setAlert(syncError.message || COPY.connectionFailed);
        }
      } else {
        setAlert(COPY.connectionFailed);
      }
      setIsSyncing(false);
    }
  };

  return (
    <Col className="data-section" data-testid="sync-card">
      <h2 className="data-section__title">Sync with your party</h2>
      <p className="data-section__description">
        Pull in what your family added, review it, then merge it in.
      </p>
      <Button
        type="submit"
        variant="primary"
        disabled={!enabled || isSyncing}
        onClick={handleSync}
      >
        {isSyncing ? "Syncing…" : "Sync with party"}
      </Button>
      {/* role=status has implicit aria-live=polite — announces progress
          and success without interrupting (DESIGN §5). */}
      {isSyncing && <p role="status">Syncing with your party…</p>}
      <p className="data-section__description text-secondary sync-caption">
        {caption}
      </p>
      {status && !isSyncing && (
        <p role="status" className="sync-status">
          {status}
        </p>
      )}
      {alert && !isSyncing && (
        <p
          role="alert"
          className="restore-backup-error text-danger vertical-standard-space"
        >
          {alert}
        </p>
      )}
    </Col>
  );
};

const mapStateToProps = (state: any) => ({
  session: state.syncManager.session,
  party: state.syncManager.party,
  partyLoaded: state.syncManager.partyLoaded,
  cardNotice: state.syncManager.cardNotice,
});

const mapActionsToProps = (dispatch: any) => ({
  onRefreshMe: () => dispatch(refreshMe()),
  onSync: () => dispatch(syncWithParty()),
  onClearCardNotice: () =>
    dispatch({ type: SYNC_CARD_NOTICE_SET, payload: { cardNotice: null } }),
});

export default connect(mapStateToProps, mapActionsToProps)(SyncCard);
