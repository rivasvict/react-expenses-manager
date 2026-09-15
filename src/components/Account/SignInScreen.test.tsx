import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { signIn } from "../../redux/syncManager/actionCreators";
import {
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "../../services/syncApi/contract";
import SignInScreen from "./SignInScreen";

/**
 * Unit tests for the sign-in screen (docs/multi-user-sync/DESIGN.md §2.2).
 * The thunk is mocked, so these assert the screen's own job: validation
 * gating, the loading state, where it navigates on success, and the
 * deliberately generic credential error (AC-1.5,
 * docs/multi-user-sync/PRD.md).
 */

jest.mock("../../redux/syncManager/actionCreators", () => ({
  signIn: jest.fn(),
}));

const signInMock = signIn as unknown as jest.Mock;

// The component dispatches `signIn(values)`; with redux-thunk a returned
// function is invoked and its promise handed back to the caller.
const resolveWith = () => signInMock.mockReturnValue(() => Promise.resolve());
const rejectWith = (error: Error) =>
  signInMock.mockReturnValue(() => Promise.reject(error));

const renderSignIn = () => {
  const user = userEvent.setup();
  const store = setupStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/sign-in"]}>
        <SignInScreen />
        <Route
          path="*"
          render={({ location }) => (
            <div data-testid="location">{location.pathname}</div>
          )}
        />
      </MemoryRouter>
    </Provider>
  );
  return { user };
};

const fillCredentials = async (
  user: UserEvent,
  { email = "jane@example.com", password = "hunter22!" } = {}
) => {
  await user.type(screen.getByPlaceholderText("Email"), email);
  await user.type(screen.getByPlaceholderText("Password"), password);
};

// Submitting resolves/rejects the mocked thunk and then sets state, so the
// click is wrapped to let those updates flush inside act().
const submit = async (user: UserEvent) => {
  await act(async () => {
    await user.click(screen.getByRole("button", { name: "Sign in" }));
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  resolveWith();
});

describe("SignInScreen", () => {
  it("renders the email and password fields", () => {
    renderSignIn();

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Sign in" })
    ).toBeInTheDocument();
  });

  it("keeps the submit button disabled until both fields are filled", async () => {
    const { user } = renderSignIn();
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    expect(submitButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Email"), "jane@example.com");
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Password"), "hunter22!");
    expect(submitButton).toBeEnabled();
  });

  it("submits the typed credentials and lands on /account", async () => {
    const { user } = renderSignIn();

    await fillCredentials(user);
    await submit(user);

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/account")
    );
    expect(signInMock).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "hunter22!",
    });
  });

  it("shows a generic message for wrong credentials, never naming the field", async () => {
    rejectWith(
      createSyncApiError({
        code: SYNC_ERROR_CODES.INVALID_CREDENTIALS,
        message: "Unauthorized",
        status: 401,
      })
    );
    const { user } = renderSignIn();

    await fillCredentials(user);
    await submit(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Email or password is incorrect.");
    // AC-1.5: the copy must not reveal which half was wrong.
    expect(alert).not.toHaveTextContent(/password is wrong|no such (email|user)/i);
    // Failure keeps the user on the form so they can retry.
    expect(screen.getByTestId("location")).toHaveTextContent("/sign-in");
  });

  it("shows the server's message for other failures", async () => {
    rejectWith(
      createSyncApiError({
        code: SYNC_ERROR_CODES.NETWORK_ERROR,
        message: "Couldn't reach the sync server. Please try again.",
      })
    );
    const { user } = renderSignIn();

    await fillCredentials(user);
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't reach the sync server. Please try again."
    );
  });

  it("re-enables the form after a failure so the user can retry", async () => {
    rejectWith(
      createSyncApiError({
        code: SYNC_ERROR_CODES.INVALID_CREDENTIALS,
        message: "Unauthorized",
        status: 401,
      })
    );
    const { user } = renderSignIn();

    await fillCredentials(user);
    await submit(user);
    await screen.findByRole("alert");

    const submitButton = screen.getByRole("button", { name: "Sign in" });
    expect(submitButton).toBeEnabled();

    // A second attempt that succeeds clears the error and navigates.
    resolveWith();
    await submit(user);

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/account")
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("goes back to /account when cancelled, without signing in", async () => {
    const { user } = renderSignIn();

    // Cancel navigates synchronously, so let the Router state settle.
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(screen.getByTestId("location")).toHaveTextContent("/account");
    expect(signInMock).not.toHaveBeenCalled();
  });
});
