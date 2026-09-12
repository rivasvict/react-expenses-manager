import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";

/**
 * Integration tests for party management: blocking a member, canceling the
 * party, and how those states render for the affected users (AC-2.9,
 * AC-2.10 and AC-2.12 in docs/multi-user-sync/PRD.md;
 * docs/multi-user-sync/DESIGN.md §3.2/§3.6). All network traffic goes
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
const tom = {
  email: "tom@example.com",
  password: "hunter33!",
  firstName: "Tom",
  lastName: "Doe",
};

const seedJaneAndTom = (options?: {
  blocked?: string[];
  canceled?: boolean;
}) => {
  server.seedUser(jane);
  server.seedUser(tom);
  server.seedPartyWithMembers([jane.email, tom.email], options);
};

describe("blocking a member", () => {
  it("organizer confirms a block and the row flips to Blocked", async () => {
    seedJaneAndTom();
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Block Tom Doe" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Block Tom Doe? This cannot be undone. They'll immediately lose the ability to sync, and entries they've already contributed stay in the party's history."
    );
    // The row shows the muted Blocked label; the Block button is gone.
    expect(await screen.findByText("Blocked")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Block Tom Doe" })
    ).not.toBeInTheDocument();
    // Tom stays in the list (nothing is retroactively removed).
    expect(screen.getByText(/Tom Doe/)).toBeInTheDocument();
  });

  it("a dismissed confirm blocks nobody", async () => {
    confirmSpy.mockReturnValue(false);
    seedJaneAndTom();
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Block Tom Doe" })
    );

    expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Block Tom Doe" })
    ).toBeInTheDocument();
  });

  it("a blocked user sees the removed-from-party view with create/join open", async () => {
    seedJaneAndTom({ blocked: [tom.email] });
    const session = server.loginAs(tom.email);
    await renderApp("/party", { session });

    expect(
      await screen.findByText(
        "You've been removed from this party by its organizer."
      )
    ).toBeInTheDocument();
    // The member list is gone; the user is free to start over.
    expect(screen.queryByText("Jane's Party")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create a party" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Join a party" })
    ).toBeInTheDocument();
  });

  it("a blocked user can start a new party from the removed-from-party view", async () => {
    seedJaneAndTom({ blocked: [tom.email] });
    const session = server.loginAs(tom.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Create a party" })
    );

    // The old membership no longer stands in the way: Tom is now the
    // organizer of his own party, and the blocked notice is gone.
    expect(await screen.findByText("Tom's Party")).toBeInTheDocument();
    expect(
      screen.queryByText("You've been removed from this party by its organizer.")
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Organizer").length).toBeGreaterThan(0);
  });

  it("surfaces a block failure and keeps the party on screen", async () => {
    seedJaneAndTom();
    server.failNext("POST /api/party/members/user-2/block", {
      status: 409,
      code: "CONFLICT",
      message: "The party changed concurrently. Please try again.",
    });
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Block Tom Doe" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The party changed concurrently. Please try again."
    );
    // Nothing was blocked, and the control is still there to retry with.
    expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Block Tom Doe" })
    ).toBeInTheDocument();
  });
});

describe("canceling the party", () => {
  it("organizer confirms the cancel and sees the canceled view", async () => {
    seedJaneAndTom();
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Cancel party" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Cancel Jane's Party? This cannot be undone. No member will be able to sync afterward, and nobody's local data is deleted."
    );
    expect(
      await screen.findByText(
        "Your party was canceled. Create or join a new one to sync again."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Jane's Party")).not.toBeInTheDocument();
  });

  it("a dismissed confirm cancels nothing", async () => {
    confirmSpy.mockReturnValue(false);
    seedJaneAndTom();
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Cancel party" })
    );

    expect(screen.getByText("Jane's Party")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Your party was canceled. Create or join a new one to sync again."
      )
    ).not.toBeInTheDocument();
  });

  it("a member of a canceled party sees the same canceled view", async () => {
    seedJaneAndTom({ canceled: true });
    const session = server.loginAs(tom.email);
    await renderApp("/party", { session });

    expect(
      await screen.findByText(
        "Your party was canceled. Create or join a new one to sync again."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create a party" })
    ).toBeInTheDocument();
  });
});

describe("organizer-only visibility (AC-2.12)", () => {
  it("a member sees neither Block buttons nor Cancel party", async () => {
    seedJaneAndTom();
    const session = server.loginAs(tom.email);
    await renderApp("/party", { session });

    expect(await screen.findByText("Jane's Party")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Block / })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel party" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Add a member" })
    ).not.toBeInTheDocument();
  });

  it("the organizer has no Block button on their own row", async () => {
    seedJaneAndTom();
    const session = server.loginAs(jane.email);
    await renderApp("/party", { session });

    expect(await screen.findByText("Jane's Party")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Block Jane Doe" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Block Tom Doe" })
    ).toBeInTheDocument();
  });
});
