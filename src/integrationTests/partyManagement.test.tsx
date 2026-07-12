import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";

/**
 * Integration tests for party management (multi-user sync PR 3): blocking
 * a member, canceling the party, and how those states render for the
 * affected users (AC-2.9, AC-2.10, AC-2.12, DESIGN §3.2/§3.6). All
 * network traffic goes through the in-memory fakeSyncServer.
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
  it("organizer confirms a block and the row flips to Blocked (AC-2.9)", async () => {
    seedJaneAndTom();
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Block Tom Doe" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Block Tom Doe? They'll immediately lose the ability to sync. Entries they've already contributed stay in the party's history."
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

  it("a blocked user sees the removed-from-party view with create/join open (DESIGN 3.6)", async () => {
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
});

describe("canceling the party", () => {
  it("organizer confirms the cancel and sees the canceled view (AC-2.10)", async () => {
    seedJaneAndTom();
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Cancel party" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Cancel Jane's Party? No member will be able to sync afterward. Nobody's local data is deleted."
    );
    expect(
      await screen.findByText(
        "Your party was canceled. Create or join a new one to sync again."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Jane's Party")).not.toBeInTheDocument();
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
