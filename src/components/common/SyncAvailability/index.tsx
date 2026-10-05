import React, { ReactNode, createContext, useContext } from "react";
import { isSyncConfigured } from "../../../config";
import {
  SyncServerStatus,
  useSyncServerStatus,
} from "../SyncStatusRing/useSyncServerStatus";

// What the rest of the app needs to know about the sync server:
//  - "available":      configured, and either answering or not yet probed.
//  - "offline":        configured, but the probe failed or the browser has no
//                      connection. Temporary: the next good probe flips it back.
//  - "not-configured": the build has no sync server address at all.
// "Not yet probed" counts as available on purpose: nothing is hidden until the
// server is known to be down, so a healthy start never flickers.
export type SyncAvailability = "available" | "offline" | "not-configured";

interface SyncAvailabilityValue {
  // The probe's own answer, for the status ring.
  status: SyncServerStatus;
  availability: SyncAvailability;
}

// Without a provider (a component rendered alone in a test) everything behaves
// as it did before availability existed.
const DEFAULT_VALUE: SyncAvailabilityValue = {
  status: "unknown",
  availability: "available",
};

const NOT_CONFIGURED_VALUE: SyncAvailabilityValue = {
  status: "unknown",
  availability: "not-configured",
};

const SyncAvailabilityContext =
  createContext<SyncAvailabilityValue>(DEFAULT_VALUE);

// Split from the provider below so the probe's hooks are not called at all
// when there is no server to probe.
const ProbingProvider = ({ children }: { children: ReactNode }) => {
  const status = useSyncServerStatus();
  const availability = status === "offline" ? "offline" : "available";
  return (
    <SyncAvailabilityContext.Provider value={{ status, availability }}>
      {children}
    </SyncAvailabilityContext.Provider>
  );
};

/**
 * Runs the sync server's health probe once for the whole app and shares the
 * answer, so the app bar's ring and every screen that needs the server agree
 * on whether it is there (and only one request is made per interval).
 */
export const SyncAvailabilityProvider = ({
  children,
}: {
  children: ReactNode;
}) =>
  isSyncConfigured() ? (
    <ProbingProvider>{children}</ProbingProvider>
  ) : (
    <SyncAvailabilityContext.Provider value={NOT_CONFIGURED_VALUE}>
      {children}
    </SyncAvailabilityContext.Provider>
  );

export const useSyncAvailability = (): SyncAvailabilityValue =>
  useContext(SyncAvailabilityContext);
