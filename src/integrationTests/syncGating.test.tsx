import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * Integration tests for the sync card's gating (multi-user sync PR 4,
 * DESIGN §4.1, AC-2.11): the button is disabled with an always-rendered
 * explanatory caption for every non-ready state, and sync is a manual,
 * explicit action — never automatic (AC-3.1).
 */

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

let server: FakeSyncServer;

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
  server = installFakeSyncServer();
});

afterEach(() => {
  server.restore();
  jest.useRealTimers();
});

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};
const tom = {
  email: "tom@example.com",
  password: "hunter33!",
  firstName: "Tom",
  lastName: "Doe",
};

const syncButton = () => screen.getByRole("button", { name: /^Sync/ });

describe("sync card gating captions (DESIGN 4.1)", () => {
  it("logged out: disabled with the sign-in caption", async () => {
    await renderApp("/data-management");

    expect(
      await screen.findByText(
        "Sign in and join a party to sync your entries across devices."
      )
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("logged in without a party: disabled with the create/join caption", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    await renderApp("/data-management", { session });

    expect(
      await screen.findByText("Create or join a party to start syncing.")
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("blocked member: disabled with the removed caption", async () => {
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email, tom.email], {
      blocked: [tom.email],
    });
    const session = server.loginAs(tom.email);
    await renderApp("/data-management", { session });

    expect(
      await screen.findByText(
        "You've been removed from your party by its organizer. Sync is unavailable."
      )
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("canceled party: disabled with the canceled caption", async () => {
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email, tom.email], { canceled: true });
    const session = server.loginAs(tom.email);
    await renderApp("/data-management", { session });

    expect(
      await screen.findByText(
        "Your party was canceled. Create or join a new one to sync again."
      )
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("active party member: enabled with the never-synced caption", async () => {
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    const session = server.loginAs(jane.email);
    await renderApp("/data-management", { session });

    expect(await screen.findByText("Never synced yet")).toBeInTheDocument();
    expect(syncButton()).toBeEnabled();
  });
});

describe("sync is manual only (AC-3.1)", () => {
  it("never calls the backup endpoints on boot or navigation — only the button does", async () => {
    seedEntries([
      {
        date: ts(2026, MAY),
        amount: "75",
        description: "Groceries",
        type: "expense",
        categories_path: ",groceries,",
      },
    ]);
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    const session = server.loginAs(jane.email);

    // Boot on the dashboard, then walk through the app including the
    // sync card's own screen.
    const { user } = await renderApp("/", { session });
    await user.click(
      await screen.findByRole("link", { name: "Data Management" })
    );
    expect(await screen.findByText("Never synced yet")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(
      await screen.findByRole("link", { name: /add income/i })
    ).toBeInTheDocument();

    const backupCalls = server
      .getRequests()
      .filter((request) => request.includes("/api/party/backup"));
    expect(backupCalls).toEqual([]);

    // The button is the one and only trigger.
    await user.click(screen.getByRole("link", { name: "Data Management" }));
    await user.click(
      await screen.findByRole("button", { name: "Sync with party" })
    );
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(
      server
        .getRequests()
        .filter((request) => request.includes("/api/party/backup")).length
    ).toBeGreaterThan(0);
  });
});
