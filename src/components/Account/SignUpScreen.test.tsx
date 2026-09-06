import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { signUp } from "../../redux/syncManager/actionCreators";
import {
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "../../services/syncApi/contract";
import SignUpScreen from "./SignUpScreen";

/**
 * Unit tests for the sign-up screen (docs/multi-user-sync/DESIGN.md §2.2).
 * The thunk is mocked, so these assert the screen's own job: validation
 * gating (including the retyped-password match), that the confirmation field
 * is stripped before submission, navigation, and the duplicate-email recovery
 * path (AC-1.5, docs/multi-user-sync/PRD.md).
 */

jest.mock("../../redux/syncManager/actionCreators", () => ({
  signUp: jest.fn(),
}));

const signUpMock = signUp as unknown as jest.Mock;

const resolveWith = () => signUpMock.mockReturnValue(() => Promise.resolve());
const rejectWith = (error: Error) =>
  signUpMock.mockReturnValue(() => Promise.reject(error));

const jane = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  password: "hunter22!",
};

const renderSignUp = () => {
  const user = userEvent.setup();
  const store = setupStore();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/sign-up"]}>
        <SignUpScreen />
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

const fillForm = async (
  user: UserEvent,
  { retype = jane.password }: { retype?: string } = {}
) => {
  await user.type(screen.getByPlaceholderText("First Name"), jane.firstName);
  await user.type(screen.getByPlaceholderText("Last Name"), jane.lastName);
  await user.type(screen.getByPlaceholderText("Email"), jane.email);
  await user.type(screen.getByPlaceholderText("Password"), jane.password);
  await user.type(screen.getByPlaceholderText("Retype Password"), retype);
};

// Submitting resolves/rejects the mocked thunk and then sets state, so the
// click is wrapped to let those updates flush inside act().
const submit = async (user: UserEvent) => {
  await act(async () => {
    await user.click(screen.getByRole("button", { name: "Sign up" }));
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  resolveWith();
});

describe("SignUpScreen", () => {
  it("renders every field the account needs", () => {
    renderSignUp();

    ["First Name", "Last Name", "Email", "Password", "Retype Password"].forEach(
      (placeholder) =>
        expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument()
    );
  });

  it("keeps the submit button disabled until the form is complete", async () => {
    const { user } = renderSignUp();
    const submitButton = screen.getByRole("button", { name: "Sign up" });

    expect(submitButton).toBeDisabled();

    await fillForm(user);

    expect(submitButton).toBeEnabled();
  });

  it("stays disabled while the retyped password does not match", async () => {
    const { user } = renderSignUp();

    await fillForm(user, { retype: "different!" });

    expect(screen.getByRole("button", { name: "Sign up" })).toBeDisabled();
  });

  it("submits without the confirmation field and lands on /account", async () => {
    const { user } = renderSignUp();

    await fillForm(user);
    await submit(user);

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/account")
    );
    // `password-retype` is a UI-only guard and must not reach the API.
    expect(signUpMock).toHaveBeenCalledWith(jane);
    expect(signUpMock.mock.calls[0][0]).not.toHaveProperty("password-retype");
  });

  it("offers a way to sign in when the email is already taken", async () => {
    rejectWith(
      createSyncApiError({
        code: SYNC_ERROR_CODES.EMAIL_TAKEN,
        message: "Email already registered",
        status: 409,
      })
    );
    const { user } = renderSignUp();

    await fillForm(user);
    await submit(user);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "An account with this email already exists."
    );
    // The alert offers the way out rather than dead-ending the user.
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in"
    );
  });

  it("shows the server's message for other failures", async () => {
    rejectWith(
      createSyncApiError({
        code: SYNC_ERROR_CODES.VALIDATION_ERROR,
        message: "A password is required.",
        status: 400,
      })
    );
    const { user } = renderSignUp();

    await fillForm(user);
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A password is required."
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/sign-up");
  });

  it("goes back to /account when cancelled, without signing up", async () => {
    const { user } = renderSignUp();

    // Cancel navigates synchronously, so let the Router state settle.
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Cancel" }));
    });

    expect(screen.getByTestId("location")).toHaveTextContent("/account");
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
