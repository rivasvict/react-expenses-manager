import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { generateInvitation } from "../../redux/syncManager/actionCreators";
import InviteScreen from "./InviteScreen";

/**
 * Unit tests for the invite screen (docs/multi-user-sync/DESIGN.md §3.4). The
 * thunk is mocked, so these assert the screen's own job: the two steps, and
 * the fact that the one-time code and its password live only in component
 * state and never anywhere durable (AC-2.4/NFR-2,
 * docs/multi-user-sync/PRD.md).
 */

jest.mock("../../redux/syncManager/actionCreators", () => ({
  generateInvitation: jest.fn(),
}));

const generateInvitationMock = generateInvitation as unknown as jest.Mock;

const CODE = "K7X9-QP2M";
const PASSWORD = "invite-pass";

const resolveWith = (code = CODE) =>
  generateInvitationMock.mockReturnValue(() => Promise.resolve(code));
const rejectWith = (message: string) =>
  generateInvitationMock.mockReturnValue(() =>
    Promise.reject(new Error(message))
  );

const renderInvite = () => {
  const user = userEvent.setup();
  render(
    <Provider store={setupStore()}>
      <MemoryRouter initialEntries={["/party/invite"]}>
        <InviteScreen />
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

const generate = async (user: UserEvent, password = PASSWORD) => {
  await user.type(
    screen.getByPlaceholderText("Invitation password"),
    password
  );
  await user.click(screen.getByRole("button", { name: "Generate invitation" }));
};

beforeEach(() => {
  generateInvitationMock.mockReset();
});

it("keeps Generate disabled until a password is set", async () => {
  const { user } = renderInvite();
  const generateButton = screen.getByRole("button", {
    name: "Generate invitation",
  });

  expect(generateButton).toBeDisabled();

  await user.type(screen.getByPlaceholderText("Invitation password"), "   ");
  expect(generateButton).toBeDisabled();

  await user.type(screen.getByPlaceholderText("Invitation password"), "pw");
  expect(generateButton).toBeEnabled();
});

it("sends the chosen password to the server", async () => {
  resolveWith();
  const { user } = renderInvite();
  await generate(user);

  await waitFor(() =>
    expect(generateInvitationMock).toHaveBeenCalledWith({ password: PASSWORD })
  );
});

it("shows the returned code and the password on step two", async () => {
  resolveWith();
  const { user } = renderInvite();
  await generate(user);

  expect(await screen.findByText("Invitation ready")).toBeInTheDocument();
  expect(screen.getByLabelText("Code")).toHaveValue(CODE);
  expect(screen.getByLabelText("Password")).toHaveValue(PASSWORD);
});

it("masks the password on step two until it is revealed", async () => {
  resolveWith();
  const { user } = renderInvite();
  await generate(user);
  await screen.findByText("Invitation ready");

  // The code can sit on screen while it is read out; the password should not
  // have to.
  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  expect(screen.getByLabelText("Code")).toHaveAttribute("type", "text");

  await user.click(screen.getByRole("button", { name: "Show password" }));
  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
});

it("confirms a copy against the field that was copied", async () => {
  resolveWith();
  const { user } = renderInvite();
  await generate(user);
  await screen.findByText("Invitation ready");

  await user.click(screen.getByRole("button", { name: "Copy code" }));

  // One confirmation, not one per field: copying the code must not claim the
  // password was copied too.
  expect(screen.getAllByText("Copied")).toHaveLength(1);
});

it("shows a loading label while the invitation is being generated", async () => {
  let release: (code: string) => void = () => undefined;
  generateInvitationMock.mockReturnValue(
    () => new Promise<string>((resolve) => { release = resolve; })
  );
  const { user } = renderInvite();
  await generate(user);

  expect(await screen.findByRole("button", { name: "Generating…" })).toBeDisabled();
  release(CODE);
});

it("reports a failure and stays on step one so it can be retried", async () => {
  rejectWith("Only the organizer can invite members.");
  const { user } = renderInvite();
  await generate(user);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Only the organizer can invite members."
  );
  expect(
    screen.getByRole("button", { name: "Generate invitation" })
  ).toBeEnabled();
});

it("never writes the code or the password to localStorage", async () => {
  resolveWith();
  const { user } = renderInvite();
  await generate(user);
  await screen.findByText("Invitation ready");

  // AC-2.4/NFR-2: both secrets exist only in component state. Anything
  // persisted here would outlive the screen that is supposed to own them.
  const stored = JSON.stringify(window.localStorage);
  expect(stored).not.toContain(CODE);
  expect(stored).not.toContain(PASSWORD);
});

it("returns to the party hub when done", async () => {
  resolveWith();
  const { user } = renderInvite();
  await generate(user);
  await screen.findByText("Invitation ready");

  await user.click(screen.getByRole("button", { name: "Done" }));

  expect(screen.getByTestId("location")).toHaveTextContent("/party");
});

it("cancels back to the party hub without generating anything", async () => {
  const { user } = renderInvite();

  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(screen.getByTestId("location")).toHaveTextContent("/party");
  expect(generateInvitationMock).not.toHaveBeenCalled();
});
