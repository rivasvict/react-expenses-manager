import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";

/**
 * Integration tests for redeeming an invitation (multi-user sync PR 2):
 * the happy path, the EC-6/7/8 error states and their exact copy
 * (AC-2.5–2.7). All network traffic goes through the in-memory
 * fakeSyncServer.
 */

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

let server: FakeSyncServer;

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
  server = installFakeSyncServer();
});

afterEach(() => {
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

// Seeds Jane's party plus Tom (no party) and returns an invitation code.
const seedInvitedTom = (invitePassword: string) => {
  server.seedUser(jane);
  server.seedUser(tom);
  server.seedPartyWithMembers([jane.email]);
  return server.seedInvitation({ password: invitePassword });
};

const submitJoin = async (user: any, code: string, password: string) => {
  await user.type(
    await screen.findByPlaceholderText("Invitation code"),
    code
  );
  await user.type(screen.getByPlaceholderText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Join" }));
};

describe("joining a party", () => {
  it("redeems a valid invitation and lands on the member view", async () => {
    const code = seedInvitedTom("fam-pass");
    const session = server.loginAs(tom.email);
    const { user } = await renderApp("/party", { session });

    // The no-party view offers Join (AC-2.2 in the affirmative case).
    await user.click(await screen.findByRole("link", { name: "Join a party" }));
    await submitJoin(user, code, "fam-pass");

    // Member view of Jane's party, with Tom listed.
    expect(await screen.findByText("Jane's Party")).toBeInTheDocument();
    expect(screen.getByText(/Tom Doe/)).toBeInTheDocument();
    expect(
      screen.getByText("Only Jane, the organizer, can add or remove members.")
    ).toBeInTheDocument();
  });

  it("rejects a wrong password without burning the invitation, then a retry succeeds (EC-7/AC-2.5)", async () => {
    const code = seedInvitedTom("fam-pass");
    const session = server.loginAs(tom.email);
    const { user } = await renderApp("/party/join", { session });

    await submitJoin(user, code, "wrong-pass");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "That password doesn't match this invitation. Double-check it with whoever invited you and try again."
    );
    // The fields stay filled for an immediate retry.
    expect(screen.getByPlaceholderText("Invitation code")).toHaveValue(code);

    // Retry with the correct password on the same code.
    await user.clear(screen.getByPlaceholderText("Password"));
    await user.type(screen.getByPlaceholderText("Password"), "fam-pass");
    await user.click(screen.getByRole("button", { name: "Join" }));

    expect(await screen.findByText("Jane's Party")).toBeInTheDocument();
  });

  it("rejects an already-used invitation with the exact copy (EC-8/AC-2.6)", async () => {
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email]);
    const code = server.seedInvitation({ password: "fam-pass", used: true });
    const session = server.loginAs(tom.email);
    const { user } = await renderApp("/party/join", { session });

    await submitJoin(user, code, "fam-pass");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "This invitation has already been used. Ask the organizer to send you a new one."
    );
  });

  it("defensively rejects a join while already in a party (EC-6/AC-2.7)", async () => {
    // AC-2.2 keeps /party from ever offering this route to a member; a
    // stale tab can still land here directly.
    server.seedUser(jane);
    server.seedUser(tom);
    server.seedPartyWithMembers([jane.email, tom.email]);
    const code = server.seedInvitation({ password: "fam-pass" });
    const session = server.loginAs(tom.email);
    const { user } = await renderApp("/party/join", { session });

    await submitJoin(user, code, "fam-pass");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "You already belong to a party. Refresh to see it."
    );
  });
});
