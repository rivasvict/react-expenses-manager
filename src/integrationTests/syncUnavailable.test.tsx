import { screen, act } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { HEALTH_POLL_INTERVAL_MS } from "../components/common/SyncStatusRing/useSyncServerStatus";
import * as syncApi from "../services/syncApi";
import * as config from "../config";

/**
 * Integration tests for a sync server that cannot be used
 * (design/features/hide-sync-when-unavailable/ui/decision.md): while it is
 * offline, the account chip stays but every action that needs the server is
 * replaced by a note saying so, and the sync screens give way to a "sync isn't
 * available" page. Nothing the user does offline changes, and everything comes
 * back by itself when the server answers.
 */

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");
const OFFLINE_NOTE = "Sync server is offline";

let server: FakeSyncServer;
let checkHealth: jest.SpyInstance;

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
  server = installFakeSyncServer();
  checkHealth = jest.spyOn(syncApi, "checkHealth");
});

afterEach(() => {
  checkHealth.mockRestore();
  server.restore();
  jest.useRealTimers();
});

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const serverIsOffline = () => checkHealth.mockResolvedValue(false);
const serverIsOnline = () => checkHealth.mockResolvedValue(true);

const waitForNextProbe = async () => {
  await act(async () => {
    jest.advanceTimersByTime(HEALTH_POLL_INTERVAL_MS);
  });
};

describe("Data Management while the sync server is offline", () => {
  it("replaces the sync button with a note, and leaves backup and restore alone", async () => {
    serverIsOffline();
    await renderApp("/data-management");

    expect(await screen.findByText(OFFLINE_NOTE)).toBeInTheDocument();
    expect(screen.getByText("Sync with your party")).toBeInTheDocument();
    expect(
      screen.getByText(/Syncing comes back by itself once the server answers/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sync with party" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download Backup" })
    ).toBeInTheDocument();
    expect(screen.getByText("Restore Backup")).toBeInTheDocument();
  });

  it("shows the sync button again once the server answers", async () => {
    serverIsOffline();
    await renderApp("/data-management");
    expect(await screen.findByText(OFFLINE_NOTE)).toBeInTheDocument();

    serverIsOnline();
    await waitForNextProbe();

    expect(
      await screen.findByRole("button", { name: "Sync with party" })
    ).toBeInTheDocument();
    expect(screen.queryByText(OFFLINE_NOTE)).not.toBeInTheDocument();
  });

  it("stops asking the server about the party once it is known to be offline", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    serverIsOffline();
    await renderApp("/data-management", { session });
    await screen.findByText(OFFLINE_NOTE);
    // Before the first probe answers the server counts as available, so the
    // card's one membership check may already have gone out. Nothing more
    // follows it while the server stays offline.
    const requestsWhenKnownOffline = server.getRequests().length;

    await waitForNextProbe();
    await waitForNextProbe();

    expect(server.getRequests()).toHaveLength(requestsWhenKnownOffline);
  });

  it("shows the Spanish wording when the app is in Spanish", async () => {
    localStorage.setItem("settings.language", "es");
    serverIsOffline();

    await renderApp("/data-management");

    expect(
      await screen.findByText("El servidor de sincronización está sin conexión")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sincronizar con el grupo" })
    ).not.toBeInTheDocument();
  });
});

describe("Account while the sync server is offline", () => {
  it("keeps the app bar's account chip, with its offline ring", async () => {
    serverIsOffline();
    await renderApp("/");

    expect(
      await screen.findByRole("img", { name: "Sync server: offline" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
  });

  it("offers neither Sign in nor Sign up when signed out, and explains why", async () => {
    serverIsOffline();
    await renderApp("/account");

    expect(await screen.findByText(OFFLINE_NOTE)).toBeInTheDocument();
    expect(
      screen.getByText(/Signing in and signing up need the sync server/)
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
    expect(
      screen.getByText(/Everything still works without an account/)
    ).toBeInTheDocument();
  });

  it("keeps who is signed in and Log out, and hides the Party tile, when signed in", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    serverIsOffline();

    await renderApp("/account", { session });

    expect(await screen.findByText(OFFLINE_NOTE)).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(jane.email)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Party" })).not.toBeInTheDocument();
  });

  it("still logs out while the server is offline", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    serverIsOffline();
    const { user } = await renderApp("/account", { session });

    await user.click(await screen.findByRole("button", { name: "Log out" }));

    expect(
      await screen.findByText("Signed out. Your data stays on this device.")
    ).toBeInTheDocument();
  });

  it("shows the Party tile again, still signed in, once the server answers", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    serverIsOffline();
    await renderApp("/account", { session });
    await screen.findByText(OFFLINE_NOTE);

    serverIsOnline();
    await waitForNextProbe();

    expect(await screen.findByRole("link", { name: "Party" })).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});

describe("sync screens while the sync server is offline", () => {
  it.each([
    ["/party"],
    ["/party/invite"],
    ["/party/join"],
    ["/sign-in"],
    ["/sign-up"],
    ["/sync-review"],
  ])("replaces %s with the unavailable page", async (route) => {
    serverIsOffline();
    await renderApp(route);

    expect(
      await screen.findByText("Sync isn't available right now")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This page needs the sync server, and it isn't answering/)
    ).toBeInTheDocument();
  });

  it("leads back to the dashboard", async () => {
    serverIsOffline();
    const { user } = await renderApp("/party");

    await user.click(
      await screen.findByRole("link", { name: "Go to dashboard" })
    );

    expect(
      screen.queryByText("Sync isn't available right now")
    ).not.toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Buckets" })).toBeInTheDocument();
  });

  it("shows the Spanish wording when the app is in Spanish", async () => {
    localStorage.setItem("settings.language", "es");
    serverIsOffline();

    await renderApp("/party");

    expect(
      await screen.findByText("La sincronización no está disponible ahora")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toBeInTheDocument();
  });

  it("shows the real screen again once the server answers", async () => {
    serverIsOffline();
    await renderApp("/sign-in");
    await screen.findByText("Sync isn't available right now");

    serverIsOnline();
    await waitForNextProbe();

    expect(await screen.findByPlaceholderText("Email")).toBeInTheDocument();
  });
});

describe("while the sync server is available", () => {
  it("hides nothing", async () => {
    serverIsOnline();
    const { user } = await renderApp("/account");

    expect(await screen.findByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.queryByText(OFFLINE_NOTE)).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Sign in" }));
    expect(await screen.findByPlaceholderText("Email")).toBeInTheDocument();
  });
});

describe("a build with no sync server configured", () => {
  beforeEach(() => {
    jest.spyOn(config, "isSyncConfigured").mockReturnValue(false);
  });

  it("has no account chip or status ring in the app bar, but keeps Settings", async () => {
    await renderApp("/");

    expect(await screen.findByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Account" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Sync server/ })).not.toBeInTheDocument();
    expect(checkHealth).not.toHaveBeenCalled();
  });

  it("leaves Data Management as backup, restore and the danger zone", async () => {
    await renderApp("/data-management");

    expect(await screen.findByText("Keep your data safe")).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
    expect(screen.queryByText("Sync with your party")).not.toBeInTheDocument();
    expect(screen.queryByText(OFFLINE_NOTE)).not.toBeInTheDocument();
  });

  it("sends every sync screen, Account included, to the unavailable page", async () => {
    await renderApp("/account");

    expect(
      await screen.findByText("Sync isn't available right now")
    ).toBeInTheDocument();
    expect(screen.queryByText(OFFLINE_NOTE)).not.toBeInTheDocument();
  });
});
