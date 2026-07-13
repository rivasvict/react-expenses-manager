import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * Integration tests for sync idempotency (multi-user sync PR 5, AC-3.9,
 * EC-4): a completed review makes the next sync a no-op; rejected items
 * never re-prompt — but a re-edited (different content) version of a
 * previously rejected item does; and an abandoned review leaves no trace,
 * re-presenting everything on the next sync.
 */

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

let server: FakeSyncServer;
let confirmSpy: jest.SpyInstance;

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
  server = installFakeSyncServer();
  confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  confirmSpy.mockRestore();
  server.restore();
  jest.useRealTimers();
});

const jane = {
  email: "jane@example.com",
  password: "hunter22!",
  firstName: "Jane",
  lastName: "Doe",
};

const remoteEntry = (
  id: string,
  amount: string,
  description: string
): any => ({
  id,
  date: ts(2026, MAY, 10),
  amount,
  description,
  type: "expense",
  categories_path: ",eating out,",
  addedBy: { id: "user-2", name: "Tom" },
});

const envelope = (balance: any[]) => ({
  app: "react-expenses-manager",
  schemaVersion: 1,
  exportedAt: "2026-05-14T12:00:00.000Z",
  data: { balance, buckets: {}, categories: [], fixedEntries: [] },
});

const setup = () => {
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
  return server.loginAs(jane.email);
};

const startSync = async (user: any) => {
  await user.click(
    await screen.findByRole("button", { name: "Sync with party" })
  );
};

describe("sync idempotency (AC-3.9)", () => {
  it("after a completed review the next sync is 'You're up to date.' and rejected items never re-prompt (EC-4)", async () => {
    const session = setup();
    server.seedRemoteBackup(
      envelope([
        remoteEntry("keep", "10", "Coffee"),
        remoteEntry("drop", "20", "Bakery"),
      ]) as any
    );
    const { user } = await renderApp("/data-management", { session });

    // Review: accept Coffee, reject Bakery, upload.
    await startSync(user);
    expect(await screen.findByText("Item 1 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Accept \$10/ }));
    await user.click(
      await screen.findByRole("button", { name: /^Reject \$20/ })
    );
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    await user.click(await screen.findByRole("button", { name: "Done" }));

    // Immediate re-sync: nothing new.
    await startSync(user);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();

    // Another member re-uploads a backup that still contains the rejected
    // item (same content). It must not re-prompt — the sync silently
    // reconciles and reports up to date.
    server.seedRemoteBackup(
      envelope([
        remoteEntry("keep", "10", "Coffee"),
        remoteEntry("drop", "20", "Bakery"),
      ]) as any
    );
    await startSync(user);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(screen.queryByText(/Item 1 of/)).not.toBeInTheDocument();

    // But a re-edited version of that item (different content hash) is a
    // new decision — it DOES re-prompt.
    server.seedRemoteBackup(
      envelope([
        remoteEntry("keep", "10", "Coffee"),
        remoteEntry("drop", "25", "Bakery (updated)"),
      ]) as any
    );
    await startSync(user);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByText(/Bakery \(updated\)/)).toBeInTheDocument();
  });

  it("an abandoned review leaves no trace and re-presents everything next sync", async () => {
    const session = setup();
    server.seedRemoteBackup(
      envelope([
        remoteEntry("r1", "10", "Coffee"),
        remoteEntry("r2", "20", "Bakery"),
      ]) as any
    );
    const { user } = await renderApp("/data-management", { session });

    await startSync(user);
    expect(await screen.findByText("Item 1 of 2")).toBeInTheDocument();
    // Decide one item, then walk away via the tab bar (silent, safe
    // abandonment — DESIGN 4.3).
    await user.click(screen.getByRole("button", { name: /^Reject \$10/ }));
    expect(await screen.findByText("Item 2 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(
      await screen.findByRole("link", { name: /add income/i })
    ).toBeInTheDocument();

    // Nothing was uploaded, nothing applied, nothing remembered.
    expect(server.getUploadedBackups()).toEqual([]);
    await user.click(screen.getByRole("link", { name: "Data Management" }));

    // The next sync re-presents both items from scratch — including the
    // one "rejected" in the abandoned session.
    await startSync(user);
    expect(await screen.findByText("Item 1 of 2")).toBeInTheDocument();
    expect(screen.getByText(/Coffee/)).toBeInTheDocument();
  });
});
