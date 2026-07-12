import { screen, cleanup } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import {
  installFakeSyncServer,
  FakeSyncServer,
} from "./helpers/fakeSyncServer";

/**
 * Integration tests for accounts (multi-user sync PR 1): sign up, sign in,
 * sign out, session persistence, and the guarantee that the app stays fully
 * functional when logged out (AC-1.1–1.7). All network traffic goes through
 * the in-memory fakeSyncServer — no real requests.
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

// Drives the real sign-up form end to end.
const signUpThroughUi = async (user: any) => {
  await user.click(await screen.findByRole("link", { name: "Account" }));
  await user.click(await screen.findByRole("link", { name: "Sign up" }));

  await user.type(await screen.findByPlaceholderText("First Name"), jane.firstName);
  await user.type(screen.getByPlaceholderText("Last Name"), jane.lastName);
  await user.type(screen.getByPlaceholderText("Email"), jane.email);
  await user.type(screen.getByPlaceholderText("Password"), jane.password);
  await user.type(screen.getByPlaceholderText("Retype Password"), jane.password);
  await user.click(screen.getByRole("button", { name: "Sign up" }));
};

describe("accounts", () => {
  it("signup through the UI signs the user in and shows the account chip", async () => {
    const { user } = await renderApp("/");

    await signUpThroughUi(user);

    // Back on /account, now logged in.
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    // Header chip carries the logged-in accessible name (DESIGN §5).
    expect(
      screen.getByRole("link", { name: "Account: Jane Doe" })
    ).toBeInTheDocument();
  });

  it("duplicate-email signup shows the exact error copy as an alert", async () => {
    server.seedUser(jane);
    const { user } = await renderApp("/sign-up");

    await user.type(await screen.findByPlaceholderText("First Name"), "Janet");
    await user.type(screen.getByPlaceholderText("Last Name"), "Doe");
    await user.type(screen.getByPlaceholderText("Email"), jane.email);
    await user.type(screen.getByPlaceholderText("Password"), "another-pass");
    await user.type(screen.getByPlaceholderText("Retype Password"), "another-pass");
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "An account with this email already exists. Try signing in instead."
    );
    // The alert offers a way out (DESIGN §2.2).
    expect(
      screen.getByRole("link", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("wrong-password login shows the generic credential error (AC-1.5)", async () => {
    server.seedUser(jane);
    const { user } = await renderApp("/sign-in");

    await user.type(await screen.findByPlaceholderText("Email"), jane.email);
    await user.type(screen.getByPlaceholderText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Email or password is incorrect.");
  });

  it("login works and the session survives a fresh app start (AC-1.3)", async () => {
    server.seedUser(jane);
    const { user } = await renderApp("/sign-in");

    await user.type(await screen.findByPlaceholderText("Email"), jane.email);
    await user.type(screen.getByPlaceholderText("Password"), jane.password);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();

    // Reload analogue: unmount everything and boot the app again with a
    // fresh store — only localStorage survives, like a browser restart.
    cleanup();
    await renderApp("/account");

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Account: Jane Doe" })
    ).toBeInTheDocument();
  });

  it("logout returns to the signed-out state with a status message (AC-1.4)", async () => {
    server.seedUser(jane);
    const session = server.loginAs(jane.email);
    const { user } = await renderApp("/account", { session });

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Signed out. Your data stays on this device."
    );
    // Signed-out view is back...
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    // ...and the header chip is anonymous again.
    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Account: Jane Doe" })
    ).not.toBeInTheDocument();
  });

  it("logged-out app still renders the dashboard unchanged (AC-1.7)", async () => {
    await renderApp("/");

    // Core dashboard affordances are all present without any session.
    expect(
      await screen.findByRole("link", { name: /add income/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /add expenses/i })
    ).toBeInTheDocument();
    // The account entry point is there but anonymous.
    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
  });

  it("logged-out app still renders data management unchanged (AC-1.7)", async () => {
    await renderApp("/data-management");

    expect(await screen.findByText("Keep your data safe")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download Backup" })
    ).toBeInTheDocument();
    expect(screen.getByText("Danger zone")).toBeInTheDocument();
  });
});
