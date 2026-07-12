import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * Integration tests for the no-wizard sync paths (multi-user sync PR 4):
 * EC-1 first sync, "You're up to date" (AC-3.3), silent upload of
 * local-only additions, download failure (AC-3.11), stale blocked/
 * canceled rejections (EC-9), version-conflict restart (EC-2) and the
 * review placeholder's safe abandonment. All network traffic goes
 * through the in-memory fakeSyncServer.
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

// Envelope-shaped remote backup around the given data slices.
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

const clickSync = async (user: any) => {
  await user.click(
    await screen.findByRole("button", { name: "Sync with party" })
  );
};

describe("no-wizard sync paths", () => {
  it("EC-1: first sync uploads the local snapshot and confirms distinctly", async () => {
    const [seeded] = seedEntries([groceries]);
    const session = setupReadyParty();
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    expect(
      await screen.findByText(
        "This is the first sync for your party. Your data is now the starting point — future syncs will compare against it."
      )
    ).toBeInTheDocument();
    // The local snapshot became the initial backup (create-only upload).
    const uploads = server.getUploadedBackups();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].baseVersion).toBeNull();
    expect(uploads[0].envelope.data.balance).toEqual([seeded]);
    // The caption now reflects the successful sync.
    expect(screen.getByText("Last synced: just now")).toBeInTheDocument();
  });

  it("identical local and remote states: 'You're up to date.' with no upload (AC-3.3)", async () => {
    const [seeded] = seedEntries([groceries]);
    const session = setupReadyParty();
    server.seedRemoteBackup(remoteEnvelope({ balance: [seeded] }) as any);
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(server.getUploadedBackups()).toEqual([]);
  });

  it("local-only additions: silent upload, then 'You're up to date.'", async () => {
    const [first, second] = seedEntries([
      groceries,
      { ...groceries, amount: "20", description: "Pharmacy" },
    ]);
    const session = setupReadyParty();
    // Remote knows only the first entry; the second is a local addition.
    server.seedRemoteBackup(remoteEnvelope({ balance: [first] }) as any);
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    const uploads = server.getUploadedBackups();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].baseVersion).toBe("1");
    expect(uploads[0].envelope.data.balance).toEqual([first, second]);
  });

  it("download failure: alert, nothing local touched, existing entries still render (AC-3.11)", async () => {
    seedEntries([groceries]);
    const session = setupReadyParty();
    server.failNext("GET /api/party/backup"); // network failure
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't reach your party. Check your connection and try again."
    );
    expect(server.getUploadedBackups()).toEqual([]);
    // The button is back to a simple retry.
    expect(
      screen.getByRole("button", { name: "Sync with party" })
    ).toBeEnabled();
    // Local data untouched: the dashboard still shows the entry.
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(await screen.findByText("$75.00")).toBeInTheDocument();
  });

  it("blocked after load (EC-9): declined banner, then the card re-renders disabled", async () => {
    const session = setupReadyParty();
    const { user } = await renderApp("/data-management", { session });
    expect(await screen.findByText("Never synced yet")).toBeInTheDocument();

    // The organizer blocks Jane in another tab after this screen rendered.
    server.seedBlockMember(jane.email);
    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sync was declined: you've been removed from your party by its organizer. Nothing on this device was changed."
    );
    // Card re-renders into the matching disabled state (DESIGN 4.2).
    expect(
      await screen.findByText(
        "You've been removed from your party by its organizer. Sync is unavailable."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync with party" })).toBeDisabled();
  });

  it("canceled after load: declined banner, then the card re-renders disabled", async () => {
    const session = setupReadyParty();
    const { user } = await renderApp("/data-management", { session });
    expect(await screen.findByText("Never synced yet")).toBeInTheDocument();

    server.seedCancelParty();
    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sync was declined: your party was canceled. Nothing on this device was changed."
    );
    expect(
      await screen.findByText(
        "Your party was canceled. Create or join a new one to sync again."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync with party" })).toBeDisabled();
  });

  it("a single version conflict restarts the sync transparently (EC-2 restart rule)", async () => {
    const [seeded] = seedEntries([groceries]);
    const session = setupReadyParty();
    server.failNext("PUT /api/party/backup", {
      status: 409,
      code: "VERSION_CONFLICT",
      message: "The party backup changed since your download.",
    });
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    // The restart re-downloads and re-uploads without bothering the user.
    expect(
      await screen.findByText(
        "This is the first sync for your party. Your data is now the starting point — future syncs will compare against it."
      )
    ).toBeInTheDocument();
    const uploads = server.getUploadedBackups();
    expect(uploads).toHaveLength(1);
    expect(uploads[0].envelope.data.balance).toEqual([seeded]);
  });

  it("two consecutive conflicts surface the conflict alert (EC-2)", async () => {
    seedEntries([groceries]);
    const session = setupReadyParty();
    const conflict = {
      status: 409,
      code: "VERSION_CONFLICT",
      message: "The party backup changed since your download.",
    };
    server.failNext("PUT /api/party/backup", conflict);
    server.failNext("PUT /api/party/backup", conflict);
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your party synced new changes while you were syncing. Sync again to pick them up."
    );
    expect(server.getUploadedBackups()).toEqual([]);
  });

  it("incoming changes route to the review placeholder; cancel changes nothing", async () => {
    const [seeded] = seedEntries([groceries]);
    const session = setupReadyParty();
    // Tom added an entry remotely that Jane doesn't have.
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
          },
        ],
      }) as any
    );
    const { user } = await renderApp("/data-management", { session });

    await clickSync(user);

    // Routed to the placeholder review screen (nothing applied unreviewed).
    expect(await screen.findByText("Review changes")).toBeInTheDocument();
    expect(
      screen.getByText(/1 incoming change to review/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel review" }));
    expect(confirmSpy).toHaveBeenCalledWith(
      "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime."
    );

    // Back on Data Management; nothing was uploaded or applied.
    expect(
      await screen.findByText("Sync with your party")
    ).toBeInTheDocument();
    expect(server.getUploadedBackups()).toEqual([]);
    await user.click(screen.getByRole("link", { name: "Home" }));
    expect(await screen.findByText("$75.00")).toBeInTheDocument();
    expect(screen.queryByText("Cinema")).not.toBeInTheDocument();
  });
});
