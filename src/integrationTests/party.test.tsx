import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";

/**
 * Integration tests for parties (multi-user sync PR 2): create a party,
 * generate an invitation, and the organizer/member view split
 * (AC-2.1–2.4, AC-2.12). All network traffic goes through the in-memory
 * fakeSyncServer.
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

describe("party creation", () => {
  it("creates a party via the confirm dialog and shows the organizer view", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Create a party" })
    );

    expect(confirmSpy).toHaveBeenCalledWith(
      "Create a party? You'll become its organizer and can invite family members."
    );
    // Organizer view: auto-named party, own row, organizer badge,
    // empty-state hint, invite affordance.
    expect(await screen.findByText("Jane's Party")).toBeInTheDocument();
    expect(screen.getAllByText("Organizer").length).toBeGreaterThan(0);
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText("(you)")).toBeInTheDocument();
    expect(
      screen.getByText("Invite family members to start syncing.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add a member" })
    ).toBeInTheDocument();
    // AC-2.2: no second create/join offered once in a party.
    expect(
      screen.queryByRole("button", { name: "Create a party" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Join a party" })
    ).not.toBeInTheDocument();
  });

  it("does nothing when the confirm dialog is dismissed", async () => {
    confirmSpy.mockReturnValue(false);
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(
      await screen.findByRole("button", { name: "Create a party" })
    );

    // Still on the no-party view.
    expect(
      screen.getByRole("button", { name: "Create a party" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Jane's Party")).not.toBeInTheDocument();
  });
});

describe("invitation generation", () => {
  it("generates a one-time code and confirms copying with a live message", async () => {
    server.seedUser(jane);
    server.seedPartyWithMembers([jane.email]);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/party", { session });

    await user.click(await screen.findByRole("link", { name: "Add a member" }));

    await user.type(
      await screen.findByPlaceholderText("Invitation password"),
      "fam-pass"
    );
    await user.click(
      screen.getByRole("button", { name: "Generate invitation" })
    );

    expect(await screen.findByText("Invitation ready")).toBeInTheDocument();
    const codeField = screen.getByLabelText("Code") as HTMLInputElement;
    expect(codeField.value).toMatch(/^[A-Z2-7]{4}-[A-Z2-7]{4}$/);
    // The password travels alongside, masked by default.
    const passwordField = screen.getByLabelText(
      "Password"
    ) as HTMLInputElement;
    expect(passwordField).toHaveAttribute("type", "password");
    expect(
      screen.getByText("Share the code and password over different channels.")
    ).toBeInTheDocument();

    // Copy → transient "Copied" confirmation (aria-live region).
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(screen.getByText("Copied")).toBeInTheDocument();

    // Done returns to the party view.
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(await screen.findByText("Jane's Party")).toBeInTheDocument();
  });
});

describe("member (non-organizer) view", () => {
  it("hides all organizer controls and explains who manages members (AC-2.12/AC-2.2)", async () => {
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email, tom.email]);
    const session = server.loginAs(tom.email);
    await renderApp("/party", { session });

    expect(await screen.findByText("Jane's Party")).toBeInTheDocument();
    // Both members are listed.
    expect(screen.getByText(/Tom Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(
      screen.getByText("Only Jane, the organizer, can add or remove members.")
    ).toBeInTheDocument();
    // No organizer controls (AC-2.12)...
    expect(
      screen.queryByRole("link", { name: "Add a member" })
    ).not.toBeInTheDocument();
    // ...and no create/join affordances while already in a party (AC-2.2).
    expect(
      screen.queryByRole("button", { name: "Create a party" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Join a party" })
    ).not.toBeInTheDocument();
  });
});
