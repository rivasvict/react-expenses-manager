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
    // (Entry rows render as one "Category - Description" text node.)
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByText("Expenses"));
    expect(await screen.findByText(/Cinema/)).toBeInTheDocument();
    expect(screen.getByText(/Groceries/)).toBeInTheDocument();
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
