import React, { useEffect, useState } from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SyncGate from "./index";
import {
  SyncAvailabilityProvider,
  useSyncAvailability,
} from "../SyncAvailability";
import { HEALTH_POLL_INTERVAL_MS } from "../SyncStatusRing/useSyncServerStatus";
import * as syncApi from "../../../services/syncApi";
import * as config from "../../../config";

let checkHealth: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  checkHealth = jest.spyOn(syncApi, "checkHealth").mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const renderGate = async (
  props: React.ComponentProps<typeof SyncGate> = { children: null },
) => {
  render(
    <MemoryRouter>
      <SyncAvailabilityProvider>
        <SyncGate {...props}>
          <p>The sync screen</p>
        </SyncGate>
      </SyncAvailabilityProvider>
    </MemoryRouter>,
  );
  await act(async () => {
    await Promise.resolve();
  });
};

// What navigating to the screen from inside the running app looks like: the
// gate mounts only once the server has already answered.
const OpenedOnceServerAnswers = () => {
  const { status } = useSyncAvailability();
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (status === "online") setOpened(true);
  }, [status]);
  return opened ? (
    <SyncGate keepWhileMounted>
      <p>The sync screen</p>
    </SyncGate>
  ) : null;
};

const dropServer = async () => {
  checkHealth.mockResolvedValue(false);
  await act(async () => {
    jest.advanceTimersByTime(HEALTH_POLL_INTERVAL_MS);
  });
};

describe("SyncGate", () => {
  it("shows the screen while the server answers", async () => {
    await renderGate();

    expect(screen.getByText("The sync screen")).toBeInTheDocument();
  });

  it("replaces the screen with the unavailable page when the server is offline", async () => {
    checkHealth.mockResolvedValue(false);

    await renderGate();

    expect(screen.queryByText("The sync screen")).not.toBeInTheDocument();
    expect(
      screen.getByText("Sync isn't available right now"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to dashboard" }),
    ).toHaveAttribute("href", "/");
  });

  it("brings the screen back once the server answers again", async () => {
    checkHealth.mockResolvedValue(false);
    await renderGate();

    checkHealth.mockResolvedValue(true);
    await act(async () => {
      jest.advanceTimersByTime(HEALTH_POLL_INTERVAL_MS);
    });

    expect(screen.getByText("The sync screen")).toBeInTheDocument();
  });

  it("keeps a screen that explains the offline state itself", async () => {
    checkHealth.mockResolvedValue(false);

    await renderGate({ allowOffline: true, children: null });

    expect(screen.getByText("The sync screen")).toBeInTheDocument();
  });

  it("keeps a screen that was already open when the server drops, if it asked to", async () => {
    render(
      <MemoryRouter>
        <SyncAvailabilityProvider>
          <OpenedOnceServerAnswers />
        </SyncAvailabilityProvider>
      </MemoryRouter>
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("The sync screen")).toBeInTheDocument();

    await dropServer();

    expect(screen.getByText("The sync screen")).toBeInTheDocument();
  });

  it("does not open a keep-while-mounted screen that starts offline", async () => {
    checkHealth.mockResolvedValue(false);

    await renderGate({ keepWhileMounted: true, children: null });

    expect(screen.queryByText("The sync screen")).not.toBeInTheDocument();
  });

  it("blocks every screen, even one that allows offline, when no server is configured", async () => {
    jest.spyOn(config, "isSyncConfigured").mockReturnValue(false);

    await renderGate({ allowOffline: true, children: null });

    expect(screen.queryByText("The sync screen")).not.toBeInTheDocument();
    expect(
      screen.getByText("Sync isn't available right now"),
    ).toBeInTheDocument();
  });
});
