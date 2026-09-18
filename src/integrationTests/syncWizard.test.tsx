import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * Integration tests for the review wizard (multi-user sync PR 5,
 * DESIGN §4.3, AC-3.4/3.6/3.8): item cards with kind + attribution
 * (including the "Added anonymously" legacy fallback), accept / reject /
 * modify, and the commit-on-upload-success semantics (EC-5). Everything
 * is driven through the UI against the in-memory fakeSyncServer, seeded
 * as another family member.
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

const groceries = {
  date: ts(2026, MAY),
  amount: "75",
  description: "Groceries",
  type: "expense" as const,
  categories_path: ",groceries,",
};

const tomStamp = { id: "user-2", name: "Tom" };

const remoteEnvelope = (data: Partial<any> = {}) => ({
  app: "react-expenses-manager",
  schemaVersion: 1,
  exportedAt: "2026-05-14T12:00:00.000Z",
  data: {
    balance: [],
    buckets: {},
    categories: [],
    fixedEntries: [],
    ...data,
  },
});

const setupReadyParty = () => {
  server.seedUser(jane);
  server.seedPartyWithMembers([jane.email]);
  return server.loginAs(jane.email);
};

const startSync = async (user: any) => {
  await user.click(
    await screen.findByRole("button", { name: "Sync with party" })
  );
};

describe("review wizard", () => {
  it("presents a mixed incoming set card by card with counts and attribution, applying only accepted items", async () => {
    const [seeded] = seedEntries([groceries]);
    const session = setupReadyParty();
    server.seedRemoteBackup(
      remoteEnvelope({
        balance: [
          seeded,
          {
            id: "tom-entry",
            date: ts(2026, MAY, 10),
            amount: "42.1",
            description: "Cinema",
            type: "expense",
            categories_path: ",eating out,",
            addedBy: tomStamp,
          },
          {
            id: "legacy-entry",
            date: ts(2026, MAY, 11),
            amount: "18",
            description: "Taxi",
            type: "expense",
            categories_path: ",eating out,",
            // No addedBy: a legacy, unattributed item (QA AC-1.6 check).
          },
        ],
        fixedEntries: [
          {
            id: "tom-fixed",
            type: "expense",
            history: [
              {
                from: "2026-04",
                amount: "9.99",
                description: "Streaming",
                categories_path: ",eating out,",
                addedBy: tomStamp,
              },
            ],
          },
        ],
        buckets: {
          Pets: [{ from: "0000-00", limit: 60, addedBy: tomStamp }],
        },
      }) as any
    );
    const { user } = await renderApp("/data-management", { session });

    await startSync(user);

    // Card 1: Tom's expense entry — full facts + attribution.
    expect(await screen.findByText("Item 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("$42.10")).toBeInTheDocument();
    expect(screen.getByText("Cinema")).toBeInTheDocument();
    expect(screen.getByText("eating out")).toBeInTheDocument();
    expect(screen.getByText("May 10, 2026")).toBeInTheDocument();
    expect(screen.getByText("Added by Tom")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Accept \$42\.10/ }));

    // Card 2: the legacy item shows the anonymous fallback. Reject it.
    expect(await screen.findByText("Item 2 of 4")).toBeInTheDocument();
    expect(screen.getByText("Taxi")).toBeInTheDocument();
    expect(screen.getByText("Added anonymously")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Reject \$18/ }));

    // Card 3: the fixed-entry state.
    expect(await screen.findByText("Item 3 of 4")).toBeInTheDocument();
    expect(screen.getByText("Fixed Expense")).toBeInTheDocument();
    expect(screen.getByText("Streaming")).toBeInTheDocument();
    expect(screen.getByText("From 2026-04")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Accept \$9\.99/ }));

    // Card 4: the bucket state.
    expect(await screen.findByText("Item 4 of 4")).toBeInTheDocument();
    expect(screen.getByText("Bucket")).toBeInTheDocument();
    expect(screen.getByText("Pets")).toBeInTheDocument();
    expect(screen.getByText("$60.00 monthly allowance")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /^Accept Pets bucket/ })
    );

    // Summary → upload → success.
    expect(await screen.findByText("Review complete")).toBeInTheDocument();
    expect(
      screen.getByText("3 accepted · 0 modified · 1 rejected")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));
    expect(
      await screen.findByText("Synced! Your party is up to date.")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(await screen.findByText("Sync with your party")).toBeInTheDocument();

    // Accepted entry is visible in the month view; rejected one is absent.
    // (An entry row renders its category and description as separate
    // nodes, so a term that is both — "Groceries" — matches more than once.)
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByText("Expenses"));
    expect(await screen.findByText(/Cinema/)).toBeInTheDocument();
    expect(screen.getAllByText(/Groceries/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Taxi/)).not.toBeInTheDocument();

    // The accepted bucket shows up too.
    await user.click(screen.getByRole("link", { name: "Buckets" }));
    expect(await screen.findByText("Pets")).toBeInTheDocument();
  });

  it("modify stages the edited value — it is merged locally and uploaded (EC-5)", async () => {
    const [seeded] = seedEntries([groceries]);
    const session = setupReadyParty();
    server.seedRemoteBackup(
      remoteEnvelope({
        balance: [
          seeded,
          {
            id: "tom-entry",
            date: ts(2026, MAY, 10),
            amount: "42.1",
            description: "Cinema",
            type: "expense",
            categories_path: ",eating out,",
            addedBy: tomStamp,
          },
        ],
      }) as any
    );
    const { user } = await renderApp("/data-management", { session });

    await startSync(user);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Modify \$42\.10/ }));

    // Inline edit (DESIGN 4.3.2): change amount and description.
    const amountField = screen.getByLabelText("Amount");
    await user.clear(amountField);
    await user.type(amountField, "55");
    const descriptionField = screen.getByLabelText("Description");
    await user.clear(descriptionField);
    await user.type(descriptionField, "Cinema night");
    await user.click(screen.getByRole("button", { name: "Save & accept" }));

    expect(
      await screen.findByText("0 accepted · 1 modified · 0 rejected")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));
    await user.click(await screen.findByRole("button", { name: "Done" }));

    // The MODIFIED value is what went up (EC-5)…
    const uploads = server.getUploadedBackups();
    expect(uploads).toHaveLength(1);
    const uploaded = uploads[0].envelope.data.balance.find(
      (entry: any) => entry.id === "tom-entry"
    );
    expect(uploaded.amount).toBe("55");
    expect(uploaded.description).toBe("Cinema night");

    // …and what the user sees locally (rows render as one
    // "Category - Description" text node, hence the regexes).
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByText("Expenses"));
    expect(await screen.findByText(/Cinema night/)).toBeInTheDocument();
    expect(screen.getByText("$55.00")).toBeInTheDocument();
    // The original, unmodified description is gone.
    expect(screen.queryByText(/Cinema$/)).not.toBeInTheDocument();
  });
});

/**
 * RFC §4.1: "A brand-new fixed entry / bucket arrives as its full set of
 * states but is presented as one wizard card (its resolved current state);
 * its decision applies to all its pending states." Only a definition this
 * device has never seen groups — a new state on one it already has stays
 * its own card.
 */
describe("a brand-new definition's history (RFC §4.1)", () => {
  const netflix = {
    id: "tom-netflix",
    type: "expense",
    history: [
      {
        from: "2026-01",
        amount: "9",
        description: "Netflix",
        categories_path: ",eating out,",
        addedBy: tomStamp,
      },
      {
        from: "2026-03",
        amount: "11",
        description: "Netflix",
        categories_path: ",eating out,",
        addedBy: tomStamp,
      },
      {
        from: "2026-05",
        amount: "13",
        description: "Netflix",
        categories_path: ",eating out,",
        addedBy: tomStamp,
      },
    ],
  };

  const seedNetflixParty = (fixedEntries: any[] = [netflix]) => {
    const session = setupReadyParty();
    server.seedRemoteBackup(remoteEnvelope({ fixedEntries }) as any);
    return session;
  };

  it("is one card carrying the resolved current state, and one Accept applies every state", async () => {
    const session = seedNetflixParty();
    const { user } = await renderApp("/data-management", { session });

    await startSync(user);

    // One card for the whole definition — not one per history state.
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Fixed Expense")).toBeInTheDocument();
    expect(screen.getByText("$13.00")).toBeInTheDocument();
    expect(screen.getByText("From 2026-05")).toBeInTheDocument();
    expect(
      screen.getByText(
        "New here — your decision covers its full history (3 changes)."
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Accept \$13\.00/ }));
    expect(
      await screen.findByText("1 accepted · 0 modified · 0 rejected")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));
    await user.click(await screen.findByRole("button", { name: "Done" }));

    // The current month resolves to the latest state…
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByRole("link", { name: /fixed entries/i }));
    expect(await screen.findByText(/Netflix/)).toBeInTheDocument();
    expect(screen.getAllByText("$13.00").length).toBeGreaterThan(0);

    // …and the states before it came across with it, so past months still
    // report what the rest of the party reports.
    const [upload] = server.getUploadedBackups();
    expect(
      upload.envelope.data.fixedEntries[0].history.map(
        (state: any) => state.from
      )
    ).toEqual(["2026-01", "2026-03", "2026-05"]);
  });

  it("one Reject drops the whole definition, leaving no partial history", async () => {
    const session = seedNetflixParty();
    const { user } = await renderApp("/data-management", { session });

    await startSync(user);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Reject \$13\.00/ }));
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    await user.click(await screen.findByRole("button", { name: "Done" }));

    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByRole("link", { name: /fixed entries/i }));
    expect(screen.queryByText(/Netflix/)).not.toBeInTheDocument();
  });

  it("an edit to a definition this device already has stays its own card", async () => {
    // The device already holds the first state, so the two later ones are
    // edits — reviewed one by one, as before.
    const session = seedNetflixParty();
    server.seedRemoteBackup(remoteEnvelope({ fixedEntries: [netflix] }) as any);
    const { user } = await renderApp("/data-management", { session });

    await startSync(user);
    await user.click(
      await screen.findByRole("button", { name: /^Accept \$13\.00/ })
    );
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));
    await user.click(await screen.findByRole("button", { name: "Done" }));

    // Tom raises it again: a single new state on a definition this device
    // now has.
    server.seedRemoteBackup(
      remoteEnvelope({
        fixedEntries: [
          {
            ...netflix,
            history: [
              ...netflix.history,
              {
                from: "2026-06",
                amount: "15",
                description: "Netflix",
                categories_path: ",eating out,",
                addedBy: tomStamp,
              },
            ],
          },
        ],
      }) as any
    );
    await startSync(user);

    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("$15.00")).toBeInTheDocument();
    expect(
      screen.queryByText(/your decision covers its full history/)
    ).not.toBeInTheDocument();
  });
});

describe("leaving the wizard through the app nav (AC-3.11)", () => {
  it("asks before discarding staged decisions, and keeps them when declined", async () => {
    const [seeded] = seedEntries([groceries]);
    const session = setupReadyParty();
    server.seedRemoteBackup(
      remoteEnvelope({
        balance: [
          seeded,
          {
            id: "tom-entry",
            date: ts(2026, MAY, 10),
            amount: "42.1",
            description: "Cinema",
            type: "expense",
            categories_path: ",eating out,",
            addedBy: tomStamp,
          },
          {
            id: "tom-taxi",
            date: ts(2026, MAY, 11),
            amount: "18",
            description: "Taxi",
            type: "expense",
            categories_path: ",eating out,",
            addedBy: tomStamp,
          },
        ],
      }) as any
    );
    const { user } = await renderApp("/data-management", { session });

    await startSync(user);
    await user.click(
      await screen.findByRole("button", { name: /^Accept \$42\.10/ })
    );
    expect(await screen.findByText("Item 2 of 2")).toBeInTheDocument();

    // Declining the confirmation keeps the user on the wizard, mid-review.
    confirmSpy.mockReturnValueOnce(false);
    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(confirmSpy).toHaveBeenLastCalledWith(
      "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime."
    );
    expect(await screen.findByText("Item 2 of 2")).toBeInTheDocument();

    // Accepting it leaves — and nothing was written, so a fresh sync offers
    // both items again.
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(await screen.findByText(/Add Expenses/i)).toBeInTheDocument();
    expect(server.getUploadedBackups()).toHaveLength(0);
  });
});
