import { screen, cleanup } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * QA round-2 fix (multi-user sync PR 8) — D5 (MAJOR): rejecting another
 * member's item must NOT delete it from the shared party backup, and must
 * NOT trigger an unbounded upload ping-pong. Both upload paths union the
 * downloaded remote snapshot into what they upload, so a rejected item —
 * absent locally — is RETAINED in the backup (AC-3.9), and both members
 * converge to "You're up to date." (AC-3.3/3.8, EC-2 no-silent-loss).
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

// Tom's item X — already in the party backup ("Tom added X and synced").
const tomEntryX = {
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

const hasEntry = (env: any, id: string) =>
  env.data.balance.some((entry: any) => entry.id === id);

describe("D5 — rejecting a member's item keeps it in the backup and converges", () => {
  it("A rejects X: X stays in the party backup, A converges with no ping-pong and is never re-prompted", async () => {
    const [janeSeeded] = seedEntries([janeGroceries]);
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email, tom.email]);
    // The party backup already holds Tom's entry X.
    server.seedRemoteBackup(envelope({ balance: [tomEntryX] }) as any);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    // Jane (A) syncs → X is incoming → she REJECTS it.
    await clickSync(user);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: /^Reject \$30\.00/ })
    );
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    await user.click(await screen.findByRole("button", { name: "Done" }));

    // AC-3.9: X was NOT dropped from the uploaded backup — it is retained
    // alongside Jane's own entry.
    expect(server.getUploadedBackups()).toHaveLength(1);
    expect(hasEntry(server.getUploadedBackups()[0].envelope, "tom-entry")).toBe(
      true
    );
    expect(
      hasEntry(server.getUploadedBackups()[0].envelope, janeSeeded.id)
    ).toBe(true);

    // Jane's re-sync converges with NO further upload and NO re-prompt for
    // X (rejection is permanent; the backup keeps X regardless).
    await clickSync(user);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(screen.queryByText("Item 1 of 1")).not.toBeInTheDocument();
    expect(server.getUploadedBackups()).toHaveLength(1);

    // A third re-sync is still stable — no endless upload loop.
    await clickSync(user);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(server.getUploadedBackups()).toHaveLength(1);
  });

  it("the other member B still receives the backup (X intact) and also converges", async () => {
    seedEntries([janeGroceries]);
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email, tom.email]);
    server.seedRemoteBackup(envelope({ balance: [tomEntryX] }) as any);

    // A rejects X first, leaving the backup = Jane's entry + X.
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });
    await clickSync(user);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    await user.click(
      await screen.findByRole("button", { name: /^Reject \$30\.00/ })
    );
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    await user.click(await screen.findByRole("button", { name: "Done" }));
    expect(server.getUploadedBackups()).toHaveLength(1);

    // Now Tom (B), whose device still holds X, on a fresh device.
    cleanup();
    localStorage.clear();
    localStorage.setItem("everShowDataDisclaimer", "0");
    localStorage.setItem("balance", JSON.stringify([tomEntryX]));
    const tomSession = server.loginAs(tom.email);
    const { user: tomUser } = await renderApp("/data-management", {
      session: tomSession,
    });

    // Jane's entry is incoming; Tom accepts it. His upload retains X.
    await clickSync(tomUser);
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    await tomUser.click(screen.getByRole("button", { name: "Accept all" }));
    await tomUser.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    await tomUser.click(await screen.findByRole("button", { name: "Done" }));

    expect(server.getUploadedBackups()).toHaveLength(2);
    const tomUpload = server.getUploadedBackups()[1].envelope;
    expect(hasEntry(tomUpload, "tom-entry")).toBe(true);
    expect(tomUpload.data.balance).toHaveLength(2);

    // Tom's re-sync is clean — no ping-pong.
    await clickSync(tomUser);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(server.getUploadedBackups()).toHaveLength(2);
  });
});

// The upload-skip gate (D5) must NOT swallow standalone-category adoption:
// a member otherwise fully in sync who receives a new remote-only category
// (added by another member via AddCategory, no entry) must ADOPT it locally
// even though no upload is needed (AC-3.10) — and then stay converged.
describe("AC-3.10 — adopting a standalone remote-only category needs no upload", () => {
  // The exact same entry lives on B's device and in the backup, so nothing
  // is incoming and no item needs uploading — only the category differs.
  const sharedEntry = {
    id: "shared-1",
    date: ts(2026, MAY, 5),
    amount: "40",
    description: "Dinner",
    type: "expense",
    categories_path: ",eating out,",
  };

  it("B adopts 'Travel' locally, reaches up-to-date with NO upload, and does not re-upload on re-sync", async () => {
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    // The backup carries B's entry plus a standalone category another member
    // created (no entry uses it).
    server.seedRemoteBackup(
      envelope({ balance: [sharedEntry], categories: ["Travel"] }) as any
    );
    // B's device has the entry but not the category.
    localStorage.setItem("everShowDataDisclaimer", "0");
    localStorage.setItem("balance", JSON.stringify([sharedEntry]));
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    // Sync: nothing to review, no upload needed — but "Travel" is adopted.
    await clickSync(user);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(server.getUploadedBackups()).toEqual([]);

    // The category is now on B's Categories screen…
    await user.click(screen.getByRole("link", { name: "Categories" }));
    expect(await screen.findByText("Travel")).toBeInTheDocument();

    // …and in the entry form's category selector.
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(
      await screen.findByRole("link", { name: /add expenses/i })
    );
    expect(await screen.findByRole("combobox")).toContainHTML("Travel");

    // A re-sync stays converged with NO upload — B is not stuck re-uploading.
    await user.click(screen.getByRole("link", { name: "Data Management" }));
    await clickSync(user);
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(server.getUploadedBackups()).toEqual([]);
  });
});
