// Polls the sync server's liveness probe so the app bar can show whether it
// is reachable. Everything here is about keeping that answer cheap: one
// timer, one in-flight request, and no work at all while the tab is in the
// background.
import { useEffect, useRef, useState } from "react";
import { checkHealth } from "../../../services/syncApi";

// One probe a minute. The status is ambient information — nothing in the app
// blocks on it — so this is deliberately slow enough to be invisible in a
// network log and still fresh enough to notice a server going down.
export const HEALTH_POLL_INTERVAL_MS = 60000;

// "unknown" is the state before the first answer arrives. It exists so a
// cold start shows a neutral ring instead of flashing red at a server that
// turns out to be up.
export type SyncServerStatus = "unknown" | "online" | "offline";

export const useSyncServerStatus = (
  intervalMs: number = HEALTH_POLL_INTERVAL_MS
): SyncServerStatus => {
  const [status, setStatus] = useState<SyncServerStatus>("unknown");
  // Guards against two probes overlapping: a slow one still in flight when
  // the interval fires would otherwise stack up requests on a server that is
  // already struggling.
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;

    const probe = async () => {
      // The browser already knows when there is no connection at all, so
      // spend no request on it.
      if (navigator.onLine === false) {
        setStatus("offline");
        return;
      }
      if (inFlight.current) return;
      inFlight.current = true;
      const reachable = await checkHealth({ signal: controller.signal });
      inFlight.current = false;
      // An abort resolves as `false`; reporting that after unmount would be
      // a state update on a component that is gone.
      if (stopped) return;
      setStatus(reachable ? "online" : "offline");
    };

    // A hidden tab is one nobody is looking at: the ring it would update is
    // not on screen, and a backgrounded interval is exactly the kind of
    // idle work that drains a phone.
    const probeWhenVisible = () => {
      if (document.visibilityState === "hidden") return;
      probe();
    };

    probeWhenVisible();
    const timer = setInterval(probeWhenVisible, intervalMs);
    // Re-probe the moment the user comes back or the connection returns,
    // rather than leaving a stale answer up for the rest of the interval.
    document.addEventListener("visibilitychange", probeWhenVisible);
    window.addEventListener("online", probeWhenVisible);
    window.addEventListener("offline", probeWhenVisible);

    return () => {
      stopped = true;
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", probeWhenVisible);
      window.removeEventListener("online", probeWhenVisible);
      window.removeEventListener("offline", probeWhenVisible);
    };
  }, [intervalMs]);

  return status;
};
