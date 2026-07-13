import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * Integration tests for the Accept all / Reject all shortcuts
 * (multi-user sync PR 5, DESIGN 4.3.3, AC-3.5): both act on the REMAINING
 * unreviewed items behind a window.confirm, then jump to the summary.
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

const remoteEntry = (id: string, amount: string, description: string) => ({
  id,
  date: ts(2026, MAY, 10),
  amount,
  description,
  type: "expense",
  categories_path: ",eating out,",
  addedBy: { id: "user-2", name: "Tom" },
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
  server.seedRemoteBackup({
    app: "react-expenses-manager",
    schemaVersion: 1,
    exportedAt: "2026-05-14T12:00:00.000Z",
    data: {
      balance: [
        remoteEntry("r1", "10", "Coffee"),
        remoteEntry("r2", "20", "Bakery"),
        remoteEntry("r3", "30", "Books"),
      ],
      buckets: {},
      categories: [],
      fixedEntries: [],
    },
  } as any);
  return session;
};

const startSync = async (user: any) => {
  await user.click(
    await screen.findByRole("button", { name: "Sync with party" })
  );
  expect(await screen.findByText(/Item 1 of/)).toBeInTheDocument();
};

describe("bulk review actions (AC-3.5)", () => {
  it("Accept all confirms with the remaining count and accepts everything", async () => {
    const session = setup();
    const { user } = await renderApp("/data-management", { session });
    await startSync(user);

    await user.click(screen.getByRole("button", { name: "Accept all" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Accept the remaining 3 items without reviewing them individually?"
    );
    expect(await screen.findByText("Review complete")).toBeInTheDocument();
    expect(
      screen.getByText("3 accepted · 0 modified · 0 rejected")
    ).toBeInTheDocument();
  });

  it("Reject all acts only on the remaining items after individual reviews", async () => {
    const session = setup();
    const { user } = await renderApp("/data-management", { session });
    await startSync(user);

    // Review the first incoming item individually.
    await user.click(screen.getByRole("button", { name: /^Accept \$/ }));
    expect(await screen.findByText(/Item 2 of/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reject all" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Reject the remaining 2 items without reviewing them individually?"
    );
    expect(await screen.findByText("Review complete")).toBeInTheDocument();
    expect(
      screen.getByText("1 accepted · 0 modified · 2 rejected")
    ).toBeInTheDocument();
  });

  it("a dismissed bulk confirm changes nothing", async () => {
    confirmSpy.mockReturnValue(false);
    const session = setup();
    const { user } = await renderApp("/data-management", { session });
    await startSync(user);

    await user.click(screen.getByRole("button", { name: "Accept all" }));

    // Still on the first item.
    expect(screen.getByText(/Item 1 of/)).toBeInTheDocument();
    expect(screen.queryByText("Review complete")).not.toBeInTheDocument();
  });
});
