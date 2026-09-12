import { screen, cleanup, waitFor } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";
import { renderApp } from "./helpers/renderApp";
import { goToPrevMonth } from "./helpers/navigation";
import sampleBackup from "./fixtures/expenses-backup.sample.json";

/**
 * Integration tests for the single-file backup & restore feature (issue #109).
 *
 * These are written TDD-first, against the *intended* behaviour, before any
 * implementation exists. They will fail until the feature is built. They express
 * the acceptance criteria from the issue:
 *   - one Download control produces a single JSON file with the whole app
 *     (entries, buckets, categories, fixed entries);
 *   - one Restore control rebuilds the whole app from that single file, live,
 *     preserving time-aware bucket history and per-entry fixed-entry history
 *     (including `removed` tombstones) and fixed-entry identities;
 *   - invalid files are rejected with a visible message.
 *
 * The download seam is `downloadFileFromData` in the Data Management utils; the
 * round-trip test mocks it to capture what the app hands the browser to save.
 */

// Records every call the app makes to the download util so the round-trip test
// can inspect the produced file. Named `mock*` so jest's hoisting allows the
// factory below to reference it.
let mockDownloadCalls: Array<{ data: unknown; config: any }> = [];
jest.mock(
  "../components/common/ExpensesManager/DataManagement/utils",
  () => ({
    downloadFileFromData: (data: unknown, config: any) => {
      mockDownloadCalls.push({ data, config });
    },
  })
);

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  mockDownloadCalls = [];
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BackupData {
  balance: unknown[];
  buckets: Record<string, unknown>;
  categories: string[];
  fixedEntries: unknown[];
}

interface BackupEnvelope {
  app: string;
  schemaVersion: number;
  exportedAt?: string;
  data: BackupData;
}

const emptyData = (): BackupData => ({
  balance: [],
  buckets: {},
  categories: [],
  fixedEntries: [],
});

// Builds a valid backup envelope, overriding only the data sections a test cares
// about so each case stays small and focused.
const backup = (data: Partial<BackupData>): BackupEnvelope => ({
  app: "react-expenses-manager",
  schemaVersion: 1,
  exportedAt: "2026-05-15T12:00:00.000Z",
  data: { ...emptyData(), ...data },
});

const asFile = (contents: unknown, name = "expenses-backup.json"): File =>
  new File(
    [typeof contents === "string" ? contents : JSON.stringify(contents)],
    name,
    { type: "application/json" }
  );

// The Data Management page must expose exactly ONE restore control (a single
// "Restore Backup" button next to a single file input), not the old pair of
// entries/buckets uploads. This asserts that control exists, then feeds it a
// file and waits for the (asynchronous file-read-driven) restore to settle:
// on success the app navigates to the dashboard; on failure it stays put with
// a visible alert. Callers can rely on the restore having fully applied.
const restoreFrom = async (user: UserEvent, file: File) => {
  await screen.findByRole("button", { name: /restore backup/i });
  const inputs = screen.getAllByTestId("file-input");
  expect(inputs).toHaveLength(1);
  await user.upload(inputs[0], file);

  await waitFor(() => {
    const stillOnDataManagement = screen.queryByRole("button", {
      name: /restore backup/i,
    });
    const hasError = screen.queryByRole("alert");
    expect(stillOnDataManagement === null || hasError !== null).toBe(true);
  });
};

const readAsText = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String((e.target as FileReader).result));
    reader.onerror = () => reject(new Error("Could not read blob"));
    reader.readAsText(blob);
  });

const resolveDownloadText = async (data: unknown): Promise<string> => {
  if (typeof data === "string") return data;
  if (data instanceof Blob) return readAsText(data);
  return String(data);
};

const clickNav = async (user: UserEvent, name: RegExp) => {
  await user.click(await screen.findByRole("link", { name }));
};

// ---------------------------------------------------------------------------
// Restore: entries
// ---------------------------------------------------------------------------

describe("restore — incomes and expenses", () => {
  it("rebuilds this month's incomes and expenses from a single backup file", async () => {
    const file = asFile(
      backup({
        balance: [
          {
            id: "e1",
            amount: "1000",
            description: "Pay",
            type: "income",
            categories_path: ",salary,",
            date: PINNED_DATE.getTime(),
          },
          {
            id: "e2",
            amount: "200",
            description: "Dinner",
            type: "expense",
            categories_path: ",eating out,",
            date: PINNED_DATE.getTime(),
          },
        ],
      })
    );

    const { user } = await renderApp("/data-management");
    await restoreFrom(user, file);

    // The restore must update the live app, not just storage: the dashboard for
    // May 2026 reflects the restored totals without a reload.
    await clickNav(user, /home/i);
    expect(await screen.findByText("$1,000.00")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Restore: categories
// ---------------------------------------------------------------------------

describe("restore — user-created categories", () => {
  it("restores a category that has no bucket yet", async () => {
    const file = asFile(backup({ categories: ["Gifts"] }));

    const { user } = await renderApp("/data-management");
    await restoreFrom(user, file);

    await clickNav(user, /categories/i);

    const gifts = await screen.findByTestId("category-gifts");
    expect(gifts).toHaveTextContent("Gifts");
    expect(gifts).toHaveTextContent(/no bucket/i);
  });
});

// ---------------------------------------------------------------------------
// Restore: buckets with time-aware history
// ---------------------------------------------------------------------------

describe("restore — buckets with time-aware limit history", () => {
  it("keeps a per-month bucket-limit history so past and current months differ", async () => {
    const file = asFile(
      backup({
        // Food started at 200 and was raised to 150... no: raised down to 150 in May.
        buckets: {
          Food: [
            { from: "0000-00", limit: 200 },
            { from: "2026-05", limit: 150 },
          ],
        },
        // A January entry makes the tree span Jan–May so Prev navigation exists.
        balance: [
          {
            id: "anchor",
            amount: "100",
            description: "Pay",
            type: "income",
            categories_path: ",salary,",
            date: new Date(2026, 0, 15).getTime(),
          },
        ],
      })
    );

    const { user } = await renderApp("/data-management");
    await restoreFrom(user, file);

    await clickNav(user, /buckets/i);
    await screen.findByText("May 2026");

    // May: the most recent limit (150).
    expect(screen.getByTestId("bucket-food-carry-over").textContent).toMatch(
      /\$150\.00/
    );

    // April: the earlier limit (200) — proving the history survived, not just
    // the latest value.
    await goToPrevMonth(user, "April 2026");
    expect(screen.getByTestId("bucket-food-carry-over").textContent).toMatch(
      /\$200\.00/
    );
  });
});

// ---------------------------------------------------------------------------
// Restore: fixed (recurring) entries — multiplicity + tombstones
// ---------------------------------------------------------------------------

describe("restore — fixed entries", () => {
  it("restores multiple same-category recurring entries and honours removal tombstones", async () => {
    const file = asFile(
      backup({
        // Anchor entry so the tree spans Jan–May and the recurring entries
        // materialise into every month.
        balance: [
          {
            id: "anchor",
            amount: "100",
            description: "Pay",
            type: "income",
            categories_path: ",salary,",
            date: new Date(2026, 0, 15).getTime(),
          },
        ],
        fixedEntries: [
          {
            id: "fx-groceries",
            type: "expense",
            history: [
              {
                from: "2026-01",
                amount: 200,
                description: "Groceries",
                categories_path: ",food,",
              },
            ],
          },
          {
            id: "fx-snacks",
            type: "expense",
            history: [
              {
                from: "2026-01",
                amount: 50,
                description: "Snacks",
                categories_path: ",food,",
              },
              // Cancelled from May forward (tombstone).
              { from: "2026-05", removed: true },
            ],
          },
        ],
      })
    );

    const { user } = await renderApp("/data-management");
    await restoreFrom(user, file);

    await clickNav(user, /fixed entries/i);
    await screen.findByText("May 2026");

    // May: Snacks was cancelled (tombstone), Groceries still recurs.
    expect(await screen.findByText(/Groceries/)).toBeInTheDocument();
    expect(screen.queryByText(/Snacks/)).not.toBeInTheDocument();

    // April (before the tombstone): both same-category recurring entries exist.
    await goToPrevMonth(user, "April 2026");
    expect(await screen.findByText(/Groceries/)).toBeInTheDocument();
    expect(screen.getByText(/Snacks/)).toBeInTheDocument();
  });

  it("preserves a fixed entry's identity so a restored recurring entry can be edited", async () => {
    const file = asFile(
      backup({
        fixedEntries: [
          {
            id: "fx-gym",
            type: "expense",
            history: [
              {
                from: "2026-01",
                amount: 60,
                description: "Gym",
                categories_path: ",food,",
              },
            ],
          },
        ],
      })
    );

    const { user } = await renderApp("/data-management");
    await restoreFrom(user, file);

    await clickNav(user, /fixed entries/i);
    await screen.findByText("May 2026");

    // Clicking a materialised fixed entry routes to its edit form via `fixedId`;
    // that only works if the restored entry kept its identity.
    await user.click(await screen.findByText(/Gym/));

    const amountInput = (await screen.findByPlaceholderText(
      /insert expense amount/i
    )) as HTMLInputElement;
    expect(amountInput.value).toBe("60");
    const toggle = (await screen.findByLabelText(
      /recurring/i
    )) as HTMLInputElement;
    expect(toggle.checked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Restore: validation
// ---------------------------------------------------------------------------

describe("restore — invalid files", () => {
  it("rejects a file that is not a valid backup and changes nothing", async () => {
    const file = asFile({ app: "some-other-app", schemaVersion: 1, data: {} });

    const { user } = await renderApp("/data-management");
    await restoreFrom(user, file);

    // A visible error is shown...
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid|unsupported|not a valid|could not/i
    );
    // ...and nothing from the invalid file was written: balance is untouched
    // (nothing else in the app writes to it on mount), and buckets stay at
    // whatever the app's own bootstrap left them (empty), not corrupted by
    // the rejected file's contents.
    expect(localStorage.getItem("balance")).toBeNull();
    expect(JSON.parse(localStorage.getItem("buckets") || "{}")).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Round trip: download → restore
// ---------------------------------------------------------------------------

describe("round trip — download produces a single JSON file that restores the app", () => {
  it("exports one JSON file with every section and re-imports it into a cleared app", async () => {
    // Seed a full app across all four persisted keys, including a regular
    // (non-recurring) expense so the round trip exercises every section:
    // an income, an expense, a bucket, a standalone category, and a fixed entry.
    localStorage.setItem(
      "balance",
      JSON.stringify([
        {
          id: "e1",
          amount: "1000",
          description: "Pay",
          type: "income",
          categories_path: ",salary,",
          date: PINNED_DATE.getTime(),
        },
        {
          id: "e2",
          amount: "50",
          description: "Snacks",
          type: "expense",
          categories_path: ",food,",
          date: PINNED_DATE.getTime(),
        },
      ])
    );
    localStorage.setItem(
      "buckets",
      JSON.stringify({ Food: [{ from: "0000-00", limit: 200 }] })
    );
    localStorage.setItem("categories", JSON.stringify(["Gifts"]));
    localStorage.setItem(
      "fixedEntries",
      JSON.stringify([
        {
          id: "fx-rent",
          type: "expense",
          history: [
            {
              from: "2026-01",
              amount: 1200,
              description: "Rent",
              categories_path: ",rent,",
            },
          ],
        },
      ])
    );

    const { user: firstUser } = await renderApp("/data-management");
    await firstUser.click(
      await screen.findByRole("button", { name: /download backup/i })
    );

    // Exactly one file is produced, and it is JSON.
    await waitFor(() => expect(mockDownloadCalls).toHaveLength(1));
    expect(mockDownloadCalls[0].config?.extension).toBe("json");

    const text = await resolveDownloadText(mockDownloadCalls[0].data);
    const envelope = JSON.parse(text) as BackupEnvelope;

    // The single file carries the whole application state.
    expect(envelope.app).toBe("react-expenses-manager");
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.data.balance).toHaveLength(2);
    expect(envelope.data.buckets).toHaveProperty("Food");
    expect(envelope.data.categories).toContain("Gifts");
    expect(envelope.data.fixedEntries).toHaveLength(1);

    // Now wipe everything and restore from the exported file into a fresh app.
    cleanup();
    localStorage.clear();

    const { user } = await renderApp("/data-management");
    await restoreFrom(user, asFile(text));

    // The income came back on the dashboard.
    await clickNav(user, /home/i);
    expect(await screen.findByText("$1,000.00")).toBeInTheDocument();

    // The regular (non-recurring) expense came back too.
    await clickNav(user, /^Expenses \$/);
    expect(await screen.findByText(/Snacks/)).toBeInTheDocument();

    // The bucket came back with its limit (May is the only recorded month, so
    // there is no carry-over yet), and the just-restored $50 Snacks expense is
    // reflected as spending against it.
    await clickNav(user, /buckets/i);
    await screen.findByText("May 2026");
    expect(screen.getByTestId("bucket-food-carry-over").textContent).toBe(
      "Allowance $200.00 + carried $0.00"
    );
    expect(screen.getByTestId("bucket-food-spending").textContent).toBe(
      "Spent: $50.00"
    );
    expect(screen.getByTestId("bucket-food-remaining").textContent).toBe(
      "Remaining: $150.00"
    );

    // The standalone category came back.
    await clickNav(user, /categories/i);
    expect(await screen.findByTestId("category-gifts")).toHaveTextContent(
      /Gifts.*no bucket/i
    );

    // Fixed entries came back and materialise into the month.
    await clickNav(user, /fixed entries/i);
    await screen.findByText("May 2026");
    // The fixed "Rent" entry has category "Rent" and description "Rent", now
    // rendered as a stacked two-line row — so "Rent" appears twice (title +
    // note), confirming the described row materialised.
    expect((await screen.findAllByText(/^Rent$/)).length).toBeGreaterThanOrEqual(
      2
    );
  });
});

// ---------------------------------------------------------------------------
// Restore: the committed sample backup file
// ---------------------------------------------------------------------------

describe("restore — committed sample backup file", () => {
  it("restores the full app from the shipped expenses-backup.sample.json", async () => {
    const { user } = await renderApp("/data-management");
    await restoreFrom(user, asFile(sampleBackup));

    // The sample raises Netflix to 18 from April, so May shows 18. Spotify has
    // a `removed: true` tombstone effective 2026-05 in the fixture, i.e. it was
    // cancelled as a fixed expense from May forward, so it must NOT appear here.
    await clickNav(user, /fixed entries/i);
    await screen.findByText("May 2026");
    const netflix = await screen.findByText(/Netflix/);
    expect(netflix).toBeInTheDocument();
    expect(screen.getByText("$18.00")).toBeInTheDocument();
    expect(
      screen.queryByText(/Spotify/)
    ).not.toBeInTheDocument();

    // The sample also exercises "Pet Care", a user-created category (no seed
    // bucket for it) used as a fixed recurring entry. Category names are
    // rendered through lodash's `capitalize` (only the first letter is
    // capitalized), so this is matched case-insensitively.
    expect(
      await screen.findByText(/Dog food/i)
    ).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();

    // The sample's three user-created categories are restored, each in its
    // right state: "Gifts" is unused (created but filed nowhere), "Hobby" is
    // used on a regular entry, and "Pet Care" is used on a fixed entry above.
    await clickNav(user, /categories/i);
    expect(await screen.findByTestId("category-gifts")).toHaveTextContent(
      /Gifts.*no bucket/i
    );
    expect(screen.getByTestId("category-hobby")).toHaveTextContent(
      /Hobby.*no bucket/i
    );
    expect(screen.getByTestId("category-pet care")).toHaveTextContent(
      /Pet Care.*no bucket/i
    );

    // "Hobby" is not just a name in the categories list — it was actually used
    // to file a regular expense, which must show up in the Expenses view.
    await clickNav(user, /home/i);
    await clickNav(user, /^Expenses \$/);
    expect(
      await screen.findByText(/Painting supplies/)
    ).toBeInTheDocument();
  });
});
