import { render, screen, act } from "@testing-library/react";
import SyncStatusRing from "./index";
import { HEALTH_POLL_INTERVAL_MS } from "./useSyncServerStatus";
import * as syncApi from "../../../services/syncApi";

/**
 * The ring's promise is a single colour that follows the sync server, so
 * every assertion here is about which state the user ends up looking at.
 * `checkHealth` is stubbed: its own behaviour is pinned in
 * src/services/syncApi/index.test.ts.
 */

let checkHealth: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  checkHealth = jest.spyOn(syncApi, "checkHealth").mockResolvedValue(true);
});

afterEach(() => {
  checkHealth.mockRestore();
  jest.useRealTimers();
});

// Lets the mount's first probe settle, so assertions see the answer rather
// than the "checking…" state every render starts in.
const settleProbe = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const renderRing = async () => {
  render(<SyncStatusRing />);
  await settleProbe();
};

// The ring has no text of its own; its accessible name is the whole message.
const ring = () => screen.getByRole("img");

const advanceOneInterval = async () => {
  await act(async () => {
    jest.advanceTimersByTime(HEALTH_POLL_INTERVAL_MS);
  });
};

describe("SyncStatusRing", () => {
  it("turns green once the server answers", async () => {
    await renderRing();

    expect(ring()).toHaveAccessibleName("Sync server: online");
    expect(ring()).toHaveClass("sync-status-ring--online");
  });

  it("turns red when the server cannot be reached", async () => {
    checkHealth.mockResolvedValue(false);
    await renderRing();

    expect(ring()).toHaveAccessibleName("Sync server: offline");
    expect(ring()).toHaveClass("sync-status-ring--offline");
  });

  it("shows a neutral ring until the first answer arrives, never a red flash", async () => {
    // A probe that has not settled yet: the ring must not guess.
    checkHealth.mockReturnValue(new Promise(() => {}));
    await renderRing();

    expect(ring()).toHaveAccessibleName("Sync server: checking…");
    expect(ring()).toHaveClass("sync-status-ring--unknown");
    expect(ring()).not.toHaveClass("sync-status-ring--offline");
  });

  it("follows the server from up to down on the next poll", async () => {
    await renderRing();
    expect(ring()).toHaveClass("sync-status-ring--online");

    checkHealth.mockResolvedValue(false);
    await advanceOneInterval();

    expect(ring()).toHaveClass("sync-status-ring--offline");
  });

  it("polls once per interval, not once per render", async () => {
    await renderRing();
    expect(checkHealth).toHaveBeenCalledTimes(1);

    await advanceOneInterval();
    expect(checkHealth).toHaveBeenCalledTimes(2);
  });

  it("stops polling once it is unmounted", async () => {
    const { unmount } = render(<SyncStatusRing />);
    await settleProbe();
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(HEALTH_POLL_INTERVAL_MS * 3);
    });

    expect(checkHealth).toHaveBeenCalledTimes(1);
  });
});
