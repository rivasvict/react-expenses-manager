import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * Integration tests for review-upload failure paths (multi-user sync
 * PR 5, DESIGN 4.3.4): the EC-2 mid-review version conflict (staged
 * decisions discarded, "Sync again" restarts fresh), the EC-3 network
 * failure (Retry with the same staged set, local data untouched), and a
 * mid-review block landing back on Data Management with the §4.2 banner.
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

const remoteEntry = (id: string, amount: string, description: string): any => ({
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
  const session = server.loginAs(jane.email);
  server.seedRemoteBackup(envelope([remoteEntry("r1", "10", "Coffee")]) as any);
  return session;
};

const startSync = async (user: any) => {
  await user.click(
    await screen.findByRole("button", { name: "Sync with party" })
  );
  expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
};

describe("review upload failures", () => {
  it("EC-2: a mid-review version bump conflicts on upload; Sync again restarts fresh", async () => {
    const session = setup();
    const { user } = await renderApp("/data-management", { session });
    await startSync(user);
    await user.click(screen.getByRole("button", { name: /^Accept \$10/ }));

    // Another member uploads while Jane reviews: the version moves on.
    server.seedRemoteBackup(
      envelope([
        remoteEntry("r1", "10", "Coffee"),
        remoteEntry("r2", "20", "Bakery"),
      ]) as any
    );

    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your party synced new changes while you were reviewing. Sync again to pick them up — you'll review everything fresh, including what you just saw."
    );
    // Nothing was committed anywhere.
    expect(server.getUploadedBackups()).toEqual([]);

    // Sync again → fresh download → fresh wizard including what was just
    // reviewed (staged decisions were discarded, not replayed).
    await user.click(screen.getByRole("button", { name: "Sync again" }));
    expect(await screen.findByText("Item 1 of 2")).toBeInTheDocument();
    expect(screen.getByText(/Coffee/)).toBeInTheDocument();
  });

  it("EC-3: upload network failure keeps the staged set with Retry; local data untouched", async () => {
    const session = setup();
    const { user } = await renderApp("/data-management", { session });
    await startSync(user);
    await user.click(screen.getByRole("button", { name: /^Accept \$10/ }));

    server.failNext("PUT /api/party/backup"); // transport failure
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't save your changes to your party. Check your connection and try again."
    );
    // Same staged decision set, no re-review; nothing committed yet.
    expect(
      screen.getByText("1 accepted · 0 modified · 0 rejected")
    ).toBeInTheDocument();
    expect(server.getUploadedBackups()).toEqual([]);

    // Retry re-attempts the same staged set and completes the sync.
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByText("Synced! Your party is up to date.")
    ).toBeInTheDocument();
    expect(server.getUploadedBackups()).toHaveLength(1);

    // The accepted entry is now (and only now) merged locally.
    await user.click(await screen.findByRole("button", { name: "Done" }));
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByText("Expenses"));
    expect(await screen.findByText(/Coffee/)).toBeInTheDocument();
  });

  it("a mid-review block discards the review and lands on the declined banner (EC-9)", async () => {
    const session = setup();
    const { user } = await renderApp("/data-management", { session });
    await startSync(user);
    await user.click(screen.getByRole("button", { name: /^Accept \$10/ }));

    // The organizer blocks Jane while she reviews.
    server.seedBlockMember(jane.email);
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );

    // Back on Data Management with the §4.2 banner and the disabled card.
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sync was declined: you've been removed from your party by its organizer. Nothing on this device was changed."
    );
    expect(
      await screen.findByText(
        "You've been removed from your party by its organizer. Sync is unavailable."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sync with party" })
    ).toBeDisabled();
    // Nothing was uploaded or applied.
    expect(server.getUploadedBackups()).toEqual([]);
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(await screen.findByText("$75.00")).toBeInTheDocument();
    expect(screen.queryByText(/Coffee/)).not.toBeInTheDocument();
  });
});
