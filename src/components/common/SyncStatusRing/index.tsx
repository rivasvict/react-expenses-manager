import React, { ReactNode } from "react";
import { useSyncAvailability } from "../SyncAvailability";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

// One entry per status, so the class, the label and the tooltip can never
// drift apart from each other.
const STATUS_LABEL_KEYS = {
  unknown: "syncStatus.unknown",
  online: "syncStatus.online",
  offline: "syncStatus.offline",
} as const;

interface SyncStatusRingProps {
  children: ReactNode;
}

/**
 * Reachability of the sync server, as a ring drawn around whatever it wraps
 * (the account chip in the app bar): green when it answers, red when it does
 * not, and neutral until the first answer comes back. Purely informational — it is a `role="img"` rather than a live
 * region, so it never interrupts a screen reader mid-task, and nothing in the
 * app waits on it.
 */
const SyncStatusRing = ({ children }: SyncStatusRingProps) => {
  const { t } = useTranslation();
  const { status } = useSyncAvailability();
  const label = t(STATUS_LABEL_KEYS[status]);
  return (
    <span className="sync-status-ring-wrap">
      {children}
      {/* A sibling of the children, not their parent: a `role="img"` hides
          its descendants from assistive tech, and the chip is a link. */}
      <span
        className={`sync-status-ring sync-status-ring--${status}`}
        role="img"
        aria-label={label}
        title={label}
      />
    </span>
  );
};

export default SyncStatusRing;
