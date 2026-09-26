import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button, Col } from "react-bootstrap";
import { refreshMe } from "../../../../redux/syncManager/actionCreators";
import { SYNC_DECLINED_SET } from "../../../../redux/syncManager/actions";
import { DeclinedReason } from "../../../../redux/syncManager/reducer";
import {
  syncWithParty,
  SyncOutcome,
} from "../../../../redux/syncManager/syncThunk";
import { SyncSession } from "../../../../services/session";
import { getSyncState } from "../../../../services/syncState";
import {
  Party,
  SYNC_ERROR_CODES,
  SyncApiError,
  isSyncApiError,
} from "../../../../services/syncApi/contract";
import { formatRelativeTime } from "../../../../helpers/date";
import {
  getSyncErrorMessage,
  TranslationKey,
  Translator,
  useTranslation,
} from "../../../../i18n";

interface SyncCardProps {
  session: SyncSession | null;
  party: Party | null;
  partyStatusResolved: boolean;
  declined: DeclinedReason | null;
  onRefreshMe: () => Promise<boolean>;
  onSync: () => Promise<SyncOutcome>;
  onClearDeclined: () => void;
}

// Banner copy keyed by outcome/error (docs/multi-user-sync/DESIGN.md §4.2).
// AC/EC tags in this file are in docs/multi-user-sync/PRD.md. The text itself
// lives in the translation dictionaries (src/i18n/translations/).
const COPY = {
  upToDate: "syncCard.upToDate",
  firstSync: "syncCard.firstSync",
  connectionFailed: "syncCard.connectionFailed",
  // A party member on a newer release uploaded a backup whose schema this
  // build cannot read. Distinct from a network failure: the user can act
  // on it. Negotiating schema versions is tracked in issue #170.
  unsupportedSchemaVersion: "syncCard.unsupportedSchemaVersion",
  declinedBlocked: "syncCard.declinedBlocked",
  declinedCanceled: "syncCard.declinedCanceled",
  conflict: "syncCard.conflict",
} as const;

// Banners hold a key (or the raw error) rather than finished text, so the
// wording is resolved in the current language at render time.
type BannerMessage = { key: TranslationKey } | { error: SyncApiError };

// The always-rendered explanatory caption under the button (AC-2.11:
// disabled states are explained, never silently hidden). DESIGN §4.1.
const getCaption = (
  session: SyncSession | null,
  party: Party | null,
  partyStatusResolved: boolean,
  meCheckFailed: boolean,
  translator: Translator
): { enabled: boolean; caption: string } => {
  const { t } = translator;
  if (!session)
    return {
      enabled: false,
      caption: t("syncCard.captionSignedOut"),
    };
  if (!partyStatusResolved && !party)
    return {
      enabled: false,
      caption: meCheckFailed
        ? t("syncCard.captionCheckFailed")
        : t("syncCard.captionChecking"),
    };
  if (!party)
    return {
      enabled: false,
      caption: t("syncCard.captionNoParty"),
    };
  if (party.youAreBlocked)
    return {
      enabled: false,
      caption: t("syncCard.captionBlocked"),
    };
  if (party.canceled)
    return {
      enabled: false,
      caption: t("syncCard.captionCanceled"),
    };
  const { lastSyncedAt } = getSyncState(party.id);
  return {
    enabled: true,
    caption:
      lastSyncedAt === null
        ? t("syncCard.neverSynced")
        : t("syncCard.lastSynced", {
            when: formatRelativeTime(lastSyncedAt, Date.now(), translator),
          }),
  };
};

/**
 * The "Sync with your party" card on Data Management (DESIGN §4.1–4.2).
 * Sync is a manual, explicit action (AC-3.1): the only network calls to
 * the backup endpoints happen inside the button's click handler. The
 * no-wizard outcomes render here; incoming changes hand off to
 * /sync-review.
 */
const SyncCard = ({
  session,
  party,
  partyStatusResolved,
  declined,
  onRefreshMe,
  onSync,
  onClearDeclined,
}: SyncCardProps) => {
  const translator = useTranslation();
  const { t } = translator;
  const history = useHistory();
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<TranslationKey | null>(null);
  const [alert, setAlert] = useState<BannerMessage | null>(null);
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

  // A blocked/canceled rejection discovered mid-review (DESIGN §4.3.4)
  // lands here as the same §4.2 banner a direct sync would have shown.
  useEffect(() => {
    if (!declined) return;
    setAlert({
      key:
        declined === "blocked" ? COPY.declinedBlocked : COPY.declinedCanceled,
    });
    onClearDeclined();
  }, [declined, onClearDeclined]);

  const { enabled, caption } = getCaption(
    session,
    party,
    partyStatusResolved,
    meCheckFailed,
    translator
  );

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus(null);
    setAlert(null);
    try {
      const outcome = await onSync();
      if (outcome.type === "review") {
        history.push("/sync-review");
        return;
      }
      setStatus(
        outcome.type === "first-sync" ? COPY.firstSync : COPY.upToDate
      );
    } catch (syncError) {
      if (isSyncApiError(syncError)) {
        if (syncError.code === SYNC_ERROR_CODES.BLOCKED) {
          // EC-9/stale state: distinct banner + card re-render into the
          // matching disabled state (via the /me refresh below).
          setAlert({ key: COPY.declinedBlocked });
          onRefreshMe();
        } else if (syncError.code === SYNC_ERROR_CODES.PARTY_CANCELED) {
          setAlert({ key: COPY.declinedCanceled });
          onRefreshMe();
        } else if (syncError.code === SYNC_ERROR_CODES.VERSION_CONFLICT) {
          setAlert({ key: COPY.conflict });
        } else if (syncError.code === SYNC_ERROR_CODES.NETWORK_ERROR) {
          setAlert({ key: COPY.connectionFailed });
        } else if (
          syncError.code === SYNC_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION
        ) {
          setAlert({ key: COPY.unsupportedSchemaVersion });
        } else {
          setAlert({ error: syncError });
        }
      } else {
        setAlert({ key: COPY.connectionFailed });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Col className="data-section" data-testid="sync-card">
      <h2 className="data-section__title">{t("syncCard.title")}</h2>
      <p className="data-section__description">{t("syncCard.description")}</p>
      <Button
        type="submit"
        variant="primary"
        disabled={!enabled || isSyncing}
        onClick={handleSync}
      >
        {isSyncing ? t("syncCard.syncing") : t("syncCard.syncButton")}
      </Button>
      {/* role=status has implicit aria-live=polite — announces progress
          and success without interrupting (DESIGN §5). */}
      {isSyncing && <p role="status">{t("syncCard.syncingStatus")}</p>}
      <p className="data-section__description text-secondary sync-caption">
        {caption}
      </p>
      {status && !isSyncing && (
        <p role="status" className="sync-status">
          {t(status)}
        </p>
      )}
      {alert && !isSyncing && (
        <p
          role="alert"
          className="restore-backup-error text-danger vertical-standard-space"
        >
          {"key" in alert
            ? t(alert.key)
            : getSyncErrorMessage(
                alert.error,
                translator,
                COPY.connectionFailed
              )}
        </p>
      )}
    </Col>
  );
};

const mapStateToProps = (state: any) => ({
  session: state.syncManager.session,
  party: state.syncManager.party,
  partyStatusResolved: state.syncManager.partyStatusResolved,
  declined: state.syncManager.declined,
});

const mapActionsToProps = (dispatch: any) => ({
  onRefreshMe: () => dispatch(refreshMe()),
  onSync: () => dispatch(syncWithParty()),
  onClearDeclined: () =>
    dispatch({ type: SYNC_DECLINED_SET, payload: { declined: null } }),
});

export default connect(mapStateToProps, mapActionsToProps)(SyncCard);
