import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";
import { seedEntries, ts, MAY } from "./helpers/seed";

/**
 * DoD hardening tests (multi-user sync PR 6) closing the QA-flagged gaps
 * from the TEST-PLAN:
 * - TC-1.11: a dead token degrades the UI to logged-out, no dead ends.
 * - TC-3.6:  blocking is not retroactive — a blocked member's already-
 *            synced entries still flow to other members (AC-2.9).
 * - TC-4.10: a logged-out visit makes zero sync API requests.
 * - TC-5.19: wizard mount focuses the heading; advances focus the card.
 * - PR-5 nit: a failed "Sync again" surfaces the connection banner.
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

const envelope = (balance: any[]) => ({
  app: "react-expenses-manager",
  schemaVersion: 1,
  exportedAt: "2026-05-14T12:00:00.000Z",
  data: { balance, buckets: {}, categories: [], fixedEntries: [] },
});

const tomEntry = {
  id: "tom-entry",
  date: ts(2026, MAY, 10),
  amount: "42.1",
  description: "Cinema",
  type: "expense",
  categories_path: ",eating out,",
  addedBy: { id: "user-2", name: "Tom" },
};

describe("session expiry degradation (TC-1.11)", () => {
  it("a 401 on an authenticated call falls back to the logged-out view without a dead end", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    server.failNext("GET /api/me", {
      status: 401,
      code: "UNAUTHORIZED",
      message: "You need to sign in again.",
    });

    // Data Management refreshes /me on mount — the injected 401 kills the
    // session centrally.
    await renderApp("/data-management", { session });

    // The card lands on the logged-out caption, not a stuck spinner…
    expect(
      await screen.findByText(
        "Sign in and join a party to sync your entries across devices."
      )
    ).toBeInTheDocument();
    // …and the header chip is anonymous again.
    expect(
      await screen.findByRole("link", { name: "Account" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Account: Jane Doe" })
    ).not.toBeInTheDocument();
  });
});

describe("blocking is not retroactive (TC-3.6 / AC-2.9)", () => {
  it("a blocked member's already-synced entry still reaches other members", async () => {
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
    server.seedUser(tom);
    // Tom synced his entry into the party backup, THEN got blocked.
    server.seedPartyWithMembers([jane.email, tom.email], {
      blocked: [tom.email],
    });
    server.seedRemoteBackup(envelope([tomEntry]) as any);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    await user.click(
      await screen.findByRole("button", { name: "Sync with party" })
    );

    // Tom's contribution is presented (attributed), not stripped.
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("Added by Tom")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Accept \$42\.10/ }));
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    await user.click(await screen.findByRole("button", { name: "Done" }));

    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByText("Expenses"));
    expect(await screen.findByText(/Cinema/)).toBeInTheDocument();
  });
});

describe("zero sync requests without interaction (TC-4.10 / AC-3.1)", () => {
  it("a logged-out Data Management visit performs no sync API request at all", async () => {
    await renderApp("/data-management");
    expect(
      await screen.findByText(
        "Sign in and join a party to sync your entries across devices."
      )
    ).toBeInTheDocument();
    expect(server.getRequests()).toEqual([]);
  });
});

describe("wizard focus management (TC-5.19 / DESIGN §5)", () => {
  it("first mount focuses the screen heading; an advance focuses the card container", async () => {
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
    server.seedRemoteBackup(
      envelope([tomEntry, { ...tomEntry, id: "e2", description: "Bakery" }]) as any
    );
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    await user.click(
      await screen.findByRole("button", { name: "Sync with party" })
    );
    await screen.findByText("Item 1 of 2");

    // Mount → the "Review changes" heading is focused (announced).
    const heading = screen.getByRole("heading", { name: "Review changes" });
    expect(heading).toHaveFocus();

    // Advance → focus moves to the new card's container.
    await user.click(screen.getByRole("button", { name: /^Accept \$42\.10/ }));
    await screen.findByText("Item 2 of 2");
    expect(screen.getByTestId("review-card-container")).toHaveFocus();
    expect(heading).not.toHaveFocus();
  });
});

describe("Sync again failure surfaces (PR-5 review nit)", () => {
  it("a network failure during Sync again lands on the card with the connection banner", async () => {
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
    server.seedRemoteBackup(envelope([tomEntry]) as any);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/data-management", { session });

    await user.click(
      await screen.findByRole("button", { name: "Sync with party" })
    );
    await screen.findByText("Item 1 of 1");
    await user.click(screen.getByRole("button", { name: /^Accept \$42\.10/ }));

    // Another member uploads mid-review → upload conflicts (EC-2).
    server.seedRemoteBackup(envelope([tomEntry]) as any);
    await user.click(
      await screen.findByRole("button", { name: "Upload & finish" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /synced new changes while you were reviewing/
    );

    // The re-sync itself now fails at the network level.
    server.failNext("GET /api/party/backup");
    await user.click(screen.getByRole("button", { name: "Sync again" }));

    // Never a silent idle card: back on Data Management with the
    // connection alert.
    expect(await screen.findByText("Sync with your party")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't reach your party. Check your connection and try again."
    );
  });
});
