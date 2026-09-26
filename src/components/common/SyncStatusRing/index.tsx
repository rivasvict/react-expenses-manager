import React from "react";
import { useSyncServerStatus } from "./useSyncServerStatus";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

// One entry per status, so the class, the label and the tooltip can never
// drift apart from each other.
const STATUS_LABEL_KEYS = {
  unknown: "syncStatus.unknown",
  online: "syncStatus.online",
  offline: "syncStatus.offline",
} as const;

/**
 * Reachability of the sync server, as a small ring in the app bar: green when
 * it answers, red when it does not, and neutral until the first answer comes
 * back. Purely informational — it is a `role="img"` rather than a live
 * region, so it never interrupts a screen reader mid-task, and nothing in the
 * app waits on it.
 */
const SyncStatusRing = () => {
  const { t } = useTranslation();
  const status = useSyncServerStatus();
  const label = t(STATUS_LABEL_KEYS[status]);
  return (
    <span
      className={`sync-status-ring sync-status-ring--${status}`}
      role="img"
      aria-label={label}
      title={label}
    />
  );
};

export default SyncStatusRing;
