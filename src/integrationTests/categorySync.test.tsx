import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { ts, OCTOBER, SEPTEMBER } from "./helpers/seed";

/**
 * A category renamed or deleted by another party member reaches this device
 * through sync as an informational note in the review wizard
 * (design/features/category-management/ui/decision.md, "Sync review"): it
 * lists the user's entries it changes, its only action is Continue, and
 * continuing applies it to the local entries, bucket and category list.
 */

const PINNED_DATE = new Date("2026-10-15T12:00:00");

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

const entry = (id: string, description: string, amount: string, category: string, day: number, month = OCTOBER) => ({
  id,
  description,
  amount,
  type: "expense",
  categories_path: `,${category},`,
  date: ts(2026, month, day),
});

const shared = (category: string) => [
  entry("e1", "Sushi with Ana", "64.50", category, 12),
  entry("e2", "Pizza night", "38.00", category, 4),
  entry("e3", "Coffee & bagel", "9.75", category, 28, SEPTEMBER),
  entry("e4", "Tacos", "21.40", category, 9, SEPTEMBER),
];

const seedLocal = () => {
  localStorage.setItem(
    "categoryLists",
    JSON.stringify({ expense: ["Eating out", "Food", "Travel"], income: ["Salary"] })
  );
  localStorage.setItem(
    "buckets",
    JSON.stringify({ "Eating out": [{ from: "0000-00", limit: 400 }] })
  );
  localStorage.setItem(
    "balance",
    JSON.stringify([
      ...shared("eating out"),
      // Added here after the last sync: the other member has never seen it.
      entry("e5", "Bagel", "4.00", "eating out", 13),
    ])
  );
};

const ana = { id: "user-2", name: "Ana" };
const renamedOn = new Date("2026-10-14T09:00:00").getTime();

const renameChange = {
  id: "change-1",
  kind: "rename",
  type: "expense",
  name: "Eating out",
  newName: "Restaurants",
  at: renamedOn,
  by: ana,
};

const remoteEnvelope = (data: any) => ({
  app: "react-expenses-manager",
  schemaVersion: 1,
  exportedAt: "2026-10-14T12:00:00.000Z",
  data: { balance: [], buckets: {}, categories: [], fixedEntries: [], ...data },
});

// The party must exist before its backup is seeded.
const setupParty = () => {
  server.seedUser(jane);
  server.seedPartyWithMembers([jane.email]);
};

const startReview = async () => {
  const session = server.loginAs(jane.email);
  const { user } = await renderApp("/data-management", { session });
  await user.click(
    await screen.findByRole("button", { name: "Sync with party" })
  );
  return { user };
};

describe("category changes in the sync review", () => {
  it("shows a rename as a note listing the user's entries, with Continue only, then applies it", async () => {
    seedLocal();
    setupParty();
    server.seedRemoteBackup(
      remoteEnvelope({
        balance: shared("restaurants"),
        buckets: { Restaurants: [{ from: "0000-00", limit: 400 }] },
        categoryChanges: [renameChange],
      }) as any
    );
    const { user } = await startReview();

    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Category renamed · for your information")).toBeInTheDocument();
    expect(screen.getByText("Eating out")).toBeInTheDocument();
    expect(screen.getByText("Restaurants")).toBeInTheDocument();
    expect(
      screen.getByText("Expense category · renamed by Ana on Oct 14")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your expenses that change 5" })
    ).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("Bagel")).toBeInTheDocument();

    // Informational: no Reject, Modify, Accept all or Reject all.
    expect(screen.queryByRole("button", { name: /Reject/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Modify/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Accept all" })).not.toBeInTheDocument();
    expect(screen.getByText("Category changes can’t be rejected.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show 2 more" }));
    expect(within(list).getAllByRole("listitem")).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Review complete")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));
    expect(
      await screen.findByText("Synced! Your party is up to date.")
    ).toBeInTheDocument();

    // Every local entry, the bucket and the list follow the rename, including
    // the entry the other member had never seen.
    await user.click(screen.getByRole("link", { name: "Categories" }));
    expect(
      await screen.findByRole("button", { name: /^Restaurants/ })
    ).toHaveTextContent("Restaurants5 expenses · Bucket $400.00/mo");
    expect(screen.queryByRole("button", { name: /^Eating out/ })).not.toBeInTheDocument();
  });

  it("shows where each of the user's entries goes when a category was deleted", async () => {
    seedLocal();
    setupParty();
    server.seedRemoteBackup(
      remoteEnvelope({
        balance: [
          { ...shared("food")[0] },
          { ...shared("food")[1] },
          { ...shared("travel")[2] },
          { ...shared("food")[3] },
        ],
        categoryChanges: [
          {
            id: "change-2",
            kind: "delete",
            type: "expense",
            name: "Eating out",
            moves: { e1: "Food", e2: "Food", e3: "Travel", e4: "Food" },
            fallback: "Food",
            at: renamedOn,
            by: ana,
          },
        ],
      }) as any
    );
    const { user } = await startReview();

    expect(
      await screen.findByText("Category deleted · for your information")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Expense category · deleted by Ana on Oct 14")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your expenses that move 5" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show 2 more" }));
    expect(screen.getAllByText("→ Food")).toHaveLength(4);
    expect(screen.getAllByText("→ Travel")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("button", { name: "Upload & finish" }));
    await screen.findByText("Synced! Your party is up to date.");

    await user.click(screen.getByRole("link", { name: "Categories" }));
    expect(
      await screen.findByRole("button", { name: /^Food/ })
    ).toHaveTextContent("Food4 expenses");
    expect(screen.getByRole("button", { name: /^Travel/ })).toHaveTextContent(
      "Travel1 expense"
    );
    expect(screen.queryByRole("button", { name: /^Eating out/ })).not.toBeInTheDocument();
  });

  it("comes before the ordinary cards and counts as accepted in the summary", async () => {
    seedLocal();
    setupParty();
    server.seedRemoteBackup(
      remoteEnvelope({
        balance: [
          ...shared("restaurants"),
          entry("tom-1", "Cinema", "12.00", "restaurants", 2),
        ],
        categoryChanges: [renameChange],
      }) as any
    );
    const { user } = await startReview();

    // The note comes first; continue to the ordinary card, then reject all.
    expect(await screen.findByText("Item 1 of 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Item 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Cinema")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reject all" }));

    expect(await screen.findByText("Review complete")).toBeInTheDocument();
    expect(
      screen.getByText("1 accepted · 0 modified · 1 rejected")
    ).toBeInTheDocument();
  });
});
