import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";

/**
 * The sync-server status ring, as it appears in the running app: it is in
 * the app bar on every screen, and its colour follows whether the server
 * answers its health probe. The ring's own states are unit-tested in
 * src/components/common/SyncStatusRing; what is proven here is the wiring.
 */

let server: FakeSyncServer;

beforeEach(() => {
  localStorage.clear();
  // Fake timers, like the rest of this suite: renderApp's userEvent is set
  // up to advance them, and the ring's own poll interval must not run on
  // wall-clock time here.
  jest.useFakeTimers();
  server = installFakeSyncServer();
});

afterEach(() => {
  server.restore();
  jest.useRealTimers();
});

describe("sync server status ring", () => {
  it("shows an online ring in the app bar while the server answers", async () => {
    await renderApp("/");

    expect(
      await screen.findByRole("img", { name: "Sync server: online" })
    ).toBeInTheDocument();
  });

  it("shows an offline ring when the server cannot be reached", async () => {
    // The probe fails as a transport error — the shape of an unreachable
    // server, not of a server that answered with an error.
    server.failNext("GET /api/health");

    await renderApp("/");

    expect(
      await screen.findByRole("img", { name: "Sync server: offline" })
    ).toBeInTheDocument();
  });

  it("stays in the app bar while the user moves between screens", async () => {
    const { user } = await renderApp("/");
    expect(
      await screen.findByRole("img", { name: "Sync server: online" })
    ).toBeInTheDocument();

    await user.click(await screen.findByRole("link", { name: "Buckets" }));

    expect(
      await screen.findByRole("img", { name: "Sync server: online" })
    ).toBeInTheDocument();
  });
});
