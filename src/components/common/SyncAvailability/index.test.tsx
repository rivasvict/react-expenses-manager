import React from "react";
import { render, screen, act } from "@testing-library/react";
import { SyncAvailabilityProvider, useSyncAvailability } from "./index";
import { HEALTH_POLL_INTERVAL_MS } from "../SyncStatusRing/useSyncServerStatus";
import * as syncApi from "../../../services/syncApi";
import * as config from "../../../config";

const Probe = () => {
  const { status, availability } = useSyncAvailability();
  return (
    <p>
      {status} / {availability}
    </p>
  );
};

let checkHealth: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  checkHealth = jest.spyOn(syncApi, "checkHealth").mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const settle = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe("SyncAvailabilityProvider", () => {
  it("is available without a provider, as it was before availability existed", () => {
    render(<Probe />);

    expect(screen.getByText("unknown / available")).toBeInTheDocument();
  });

  it("is available while the server answers", async () => {
    render(
      <SyncAvailabilityProvider>
        <Probe />
      </SyncAvailabilityProvider>,
    );
    await settle();

    expect(screen.getByText("online / available")).toBeInTheDocument();
  });

  it("treats a server that has not answered yet as available", () => {
    checkHealth.mockReturnValue(new Promise(() => {}));

    render(
      <SyncAvailabilityProvider>
        <Probe />
      </SyncAvailabilityProvider>,
    );

    expect(screen.getByText("unknown / available")).toBeInTheDocument();
  });

  it("goes offline when the probe fails and recovers on the next good one", async () => {
    checkHealth.mockResolvedValue(false);
    render(
      <SyncAvailabilityProvider>
        <Probe />
      </SyncAvailabilityProvider>,
    );
    await settle();
    expect(screen.getByText("offline / offline")).toBeInTheDocument();

    checkHealth.mockResolvedValue(true);
    await act(async () => {
      jest.advanceTimersByTime(HEALTH_POLL_INTERVAL_MS);
    });

    expect(screen.getByText("online / available")).toBeInTheDocument();
  });

  it("is not configured, and never probes, when the build has no server address", async () => {
    jest.spyOn(config, "isSyncConfigured").mockReturnValue(false);

    render(
      <SyncAvailabilityProvider>
        <Probe />
      </SyncAvailabilityProvider>,
    );
    await settle();

    expect(screen.getByText("unknown / not-configured")).toBeInTheDocument();
    expect(checkHealth).not.toHaveBeenCalled();
  });
});
