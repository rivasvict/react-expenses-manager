import { renderHook, act } from "@testing-library/react";
import {
  useSyncServerStatus,
  HEALTH_POLL_INTERVAL_MS,
} from "./useSyncServerStatus";
import * as syncApi from "../../../services/syncApi";

/**
 * The colour the hook reports is asserted through the component
 * (./index.test.tsx). What is pinned here is the part of the hook nobody can
 * see: how little work it does — no probes while the tab is hidden or the
 * browser is offline, no overlapping requests, and an immediate re-probe when
 * the user comes back.
 */

let checkHealth: jest.SpyInstance;
let visibility: "visible" | "hidden";
let online: boolean;

beforeEach(() => {
  jest.useFakeTimers();
  checkHealth = jest.spyOn(syncApi, "checkHealth").mockResolvedValue(true);
  visibility = "visible";
  online = true;
  jest
    .spyOn(document, "visibilityState", "get")
    .mockImplementation(() => visibility);
  jest
    .spyOn(navigator, "onLine", "get")
    .mockImplementation(() => online);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const renderStatus = async () => {
  const view = renderHook(() => useSyncServerStatus());
  // Lets the mount's first probe settle before anything is asserted.
  await act(async () => {
    await Promise.resolve();
  });
  return view;
};

const advanceOneInterval = async () => {
  await act(async () => {
    jest.advanceTimersByTime(HEALTH_POLL_INTERVAL_MS);
  });
};

const fire = async (target: Document | Window, event: string) => {
  await act(async () => {
    target.dispatchEvent(new Event(event));
  });
};

describe("useSyncServerStatus", () => {
  it("spends no request while the tab is hidden", async () => {
    visibility = "hidden";
    await renderStatus();
    expect(checkHealth).not.toHaveBeenCalled();

    await advanceOneInterval();
    expect(checkHealth).not.toHaveBeenCalled();
  });

  it("probes again as soon as the tab becomes visible", async () => {
    visibility = "hidden";
    await renderStatus();

    visibility = "visible";
    await fire(document, "visibilitychange");

    expect(checkHealth).toHaveBeenCalledTimes(1);
  });

  it("reports offline from the browser alone when there is no connection", async () => {
    online = false;
    const { result } = await renderStatus();

    expect(result.current).toBe("offline");
    expect(checkHealth).not.toHaveBeenCalled();
  });

  it("probes immediately when the connection comes back", async () => {
    online = false;
    await renderStatus();

    online = true;
    await fire(window, "online");

    expect(checkHealth).toHaveBeenCalledTimes(1);
  });

  it("never stacks a second probe on top of one still in flight", async () => {
    // A server that has stopped answering: the interval keeps firing, but
    // the requests must not pile up on it.
    checkHealth.mockReturnValue(new Promise(() => {}));
    await renderStatus();

    await advanceOneInterval();
    await advanceOneInterval();

    expect(checkHealth).toHaveBeenCalledTimes(1);
  });
});
