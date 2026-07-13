import { screen, cleanup } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * QA round-1 fixes (multi-user sync PR 7):
 * - D1 (MAJOR): user-created categories travel through sync — the
 *   receiving member gets them, the party backup retains them, and both
 *   members converge to "You're up to date." (AC-3.10).
 * - D2: a brand-new fixed entry with several history states is ONE card
 *   whose decision applies to all states (RFC §4.1).
 * - D3: navigating away mid-review clears the staged review — a later
 *   direct visit to /sync-review finds nothing to review.
 * - D4: action aria-labels keep the contributor's name casing.
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
const tom = {
  email: "tom@example.com",
  password: "hunter33!",
  firstName: "Tom",
  lastName: "Doe",
};

const janeGroceries = {
  date: ts(2026, MAY),
  amount: "75",
  description: "Groceries",
  type: "expense" as const,
  categories_path: ",groceries,",
};

const tomPetEntry = {
  id: "tom-entry",
  date: ts(2026, MAY, 10),
  amount: "30",
  description: "Vet visit",
  type: "expense",
  categories_path: ",pet care,",
  addedBy: { id: "user-2", name: "Tom" },
};

const envelope = (data: Partial<any>) => ({
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

const clickSync = async (user: any) => {
  await user.click(
    await screen.findByRole("button", { name: "Sync with party" })
  );
};

const acceptAllAndFinish = async (user: any) => {
  await user.click(screen.getByRole("button", { name: "Accept all" }));
  await user.click(
    await screen.findByRole("button", { name: "Upload & finish" })
  );
  await user.click(await screen.findByRole("button", { name: "Done" }));
};

describe("D1 — categories travel through sync (AC-3.10)", () => {
  it("a user-created category reaches the other member, survives every upload, and both converge", async () => {
    // Tom's backup carries his custom "Pet Care" category + an entry
    // using it. Jane has her own data and no such category.
    const [janeSeeded] = seedEntries([janeGroceries]);
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email, tom.email]);
    server.seedRemoteBackup(
      envelope({
        balance: [tomPetEntry],
        categories: ["Pet Care"],
      }) as any
    );
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    // Jane reviews and accepts Tom's entry.
    await clickSync(user);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    await acceptAllAndFinish(user);

    // The uploaded party backup RETAINS the category (it used to be
    // silently dropped) and now also carries Jane's entry.
    const uploads = server.getUploadedBackups();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].envelope.data.categories).toEqual(["Pet Care"]);

    // Jane sees the category on the Categories screen…
    await user.click(screen.getByRole("link", { name: "Categories" }));
    expect(await screen.findByText("Pet Care")).toBeInTheDocument();

    // …and in the entry form's category selector.
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    const selector = await screen.findByRole("combobox");
    expect(selector).toContainHTML("Pet Care");

    // Jane's follow-up sync converges: nothing new, no ping-pong upload.
    await user.click(screen.getByRole("link", { name: "Data Management" }));
    await clickSync(user);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(server.getUploadedBackups()).toHaveLength(1);

    // Now the other member: Tom's device has his own data + category.
    cleanup();
    localStorage.clear();
    localStorage.setItem("everShowDataDisclaimer", "0");
    seedEntries([
      {
        date: ts(2026, MAY, 10),
        amount: "30",
        description: "Vet visit",
        type: "expense",
        categories_path: ",pet care,",
      },
    ]);
    // Tom's own entry has a different local id than the backup's — align
    // by seeding the exact backup entry instead.
    localStorage.setItem("balance", JSON.stringify([tomPetEntry]));
    localStorage.setItem("categories", JSON.stringify(["Pet Care"]));
    const tomSession = server.loginAs(tom.email);
    const { user: tomUser } = await renderApp("/data-management", {
      session: tomSession,
    });

    // Tom syncs: Jane's entry comes in; accept → upload retains the
    // category; the follow-up sync is clean.
    await clickSync(tomUser);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    await acceptAllAndFinish(tomUser);
    const allUploads = server.getUploadedBackups();
    expect(
      allUploads[allUploads.length - 1].envelope.data.categories
    ).toEqual(["Pet Care"]);
    expect(
      allUploads[allUploads.length - 1].envelope.data.balance
    ).toHaveLength(2);

    await clickSync(tomUser);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(server.getUploadedBackups()).toHaveLength(allUploads.length);
    // Jane's seeded entry id round-tripped intact.
    expect(
      allUploads[allUploads.length - 1].envelope.data.balance.some(
        (entry: any) => entry.id === janeSeeded.id
      )
    ).toBe(true);
  });

  it("a category promoted to a bucket is not resurrected by the union", async () => {
    seedEntries([janeGroceries]);
    // Jane already promoted "Pet Care" to a bucket locally.
    localStorage.setItem(
      "buckets",
      JSON.stringify({ "Pet Care": [{ from: "0000-00", limit: 50 }] })
    );
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    // The remote backup still lists it as a plain category.
    server.seedRemoteBackup(
      envelope({
        balance: [],
        categories: ["pet care"],
      }) as any
    );
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);
    // Local-only additions path (bucket + entry are local-only).
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    const uploads = server.getUploadedBackups();
    expect(uploads).toHaveLength(1);
    // The bucket name is excluded from the categories union.
    expect(uploads[0].envelope.data.categories).toEqual([]);
    expect(Object.keys(uploads[0].envelope.data.buckets)).toEqual(["Pet Care"]);
  });
});

describe("D2 — one card per brand-new definition (RFC §4.1)", () => {
  it("a multi-state new fixed entry reviews as one card and one accept applies every state", async () => {
    seedEntries([janeGroceries]);
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    server.seedRemoteBackup(
      envelope({
        balance: [],
        fixedEntries: [
          {
            id: "tom-fixed",
            type: "expense",
            history: [
              {
                from: "2026-01",
                amount: "9.99",
                description: "Streaming",
                categories_path: ",eating out,",
                addedBy: { id: "user-2", name: "Tom" },
              },
              {
                from: "2026-04",
                amount: "12.99",
                description: "Streaming 4K",
                categories_path: ",eating out,",
                addedBy: { id: "user-2", name: "Tom" },
              },
            ],
          },
        ],
      }) as any
    );
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    // ONE card — fronted by the resolved current state.
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Streaming 4K")).toBeInTheDocument();
    expect(screen.getByText("From 2026-04")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Accept \$12\.99/ }));
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    await user.click(await screen.findByRole("button", { name: "Done" }));

    // Every pending state went up with the accept.
    const uploads = server.getUploadedBackups();
    const uploadedFixed = uploads[0].envelope.data.fixedEntries.find(
      (definition: any) => definition.id === "tom-fixed"
    );
    expect(uploadedFixed.history).toHaveLength(2);

    // And the earlier state is live locally: January shows $9.99.
    const nextSync = await screen.findByRole("button", {
      name: "Sync with party",
    });
    expect(nextSync).toBeEnabled();
  });
});

describe("D3 — navigating away clears the staged review (DESIGN §4.3)", () => {
  it("a later direct visit to /sync-review finds nothing to review", async () => {
    seedEntries([janeGroceries]);
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    server.seedRemoteBackup(envelope({ balance: [tomPetEntry] }) as any);
    const session = server.loginAs(jane.email);
    const { user, navigate } = await renderApp("/data-management", {
      session,
    });

    await clickSync(user);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();

    // Walk away mid-review via the tab bar (silent, safe abandonment)…
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(
      await screen.findByRole("link", { name: /add income/i })
    ).toBeInTheDocument();

    // …then come back to /sync-review directly (address-bar analogue).
    await navigate("/sync-review");
    expect(
      await screen.findByText(/There's nothing to review right now/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Item 1 of/)).not.toBeInTheDocument();
    expect(server.getUploadedBackups()).toEqual([]);
  });
});

describe("D4 — aria-labels keep the contributor's name casing", () => {
  it("action buttons read 'added by Tom', not 'added by tom'", async () => {
    seedEntries([janeGroceries]);
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    server.seedRemoteBackup(envelope({ balance: [tomPetEntry] }) as any);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);
    await screen.findByText("Item 1 of 1");

    expect(
      screen.getByRole("button", {
        name: "Accept $30.00 expense added by Tom",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Modify $30.00 expense added by Tom",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Reject $30.00 expense added by Tom",
      })
    ).toBeInTheDocument();
  });
});
