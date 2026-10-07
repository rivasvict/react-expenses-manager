import React, { ReactNode, useRef } from "react";
import { useSyncAvailability } from "../SyncAvailability";
import SyncUnavailable from "./SyncUnavailable";

interface SyncGateProps {
  children: ReactNode;
  // For a screen that explains the offline state itself (Account).
  allowOffline?: boolean;
  // For a screen whose work is local once it has loaded (the sync review): if
  // it opened while the server was available, a later drop must not tear it
  // down and lose the user's choices.
  keepWhileMounted?: boolean;
}

/**
 * Shows a screen that needs the sync server only while the server can be
 * used; otherwise the "sync isn't available" screen takes its place. A build
 * with no server address always blocks, even where `allowOffline` is set.
 */
const SyncGate = ({
  children,
  allowOffline = false,
  keepWhileMounted = false,
}: SyncGateProps) => {
  const { availability, status } = useSyncAvailability();
  // Only a server that has actually answered counts: opening while it is still
  // being probed is not a promise that it is there.
  const openedOnline = useRef(status === "online");

  if (availability === "not-configured") return <SyncUnavailable />;
  if (availability === "offline") {
    const keep = allowOffline || (keepWhileMounted && openedOnline.current);
    if (!keep) return <SyncUnavailable />;
  }
  return <>{children}</>;
};

export default SyncGate;
