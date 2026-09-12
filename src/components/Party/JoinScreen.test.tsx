import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { joinParty } from "../../redux/syncManager/actionCreators";
import {
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "../../services/syncApi/contract";
import JoinScreen from "./JoinScreen";

/**
 * Unit tests for the join screen (docs/multi-user-sync/DESIGN.md §3.5). The
 * thunk is mocked, so these assert the screen's own job: gating submission,
 * the loading state, where it navigates on success, and turning each
 * contract error code into copy the invitee can act on (EC-6/7/8,
 * docs/multi-user-sync/PRD.md).
 */

jest.mock("../../redux/syncManager/actionCreators", () => ({
  joinParty: jest.fn(),
}));

const joinPartyMock = joinParty as unknown as jest.Mock;

// The component dispatches `joinParty(values)`; with redux-thunk a returned
// function is invoked and its promise handed back to the caller.
const resolveWith = () => joinPartyMock.mockReturnValue(() => Promise.resolve());
const rejectWith = (code: string, message = "Server message") =>
  joinPartyMock.mockReturnValue(() =>
    Promise.reject(createSyncApiError({ code: code as never, message }))
  );

const renderJoin = () => {
  const user = userEvent.setup();
  render(
    <Provider store={setupStore()}>
      <MemoryRouter initialEntries={["/party/join"]}>
        <JoinScreen />
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

const fillIn = async (user: UserEvent, code: string, password: string) => {
  await user.type(screen.getByPlaceholderText("Invitation code"), code);
  await user.type(screen.getByPlaceholderText("Password"), password);
};

const submit = (user: UserEvent) =>
  user.click(screen.getByRole("button", { name: "Join" }));

beforeEach(() => {
  joinPartyMock.mockReset();
});

it("keeps Join disabled until both fields are filled", async () => {
  const { user } = renderJoin();
  const join = screen.getByRole("button", { name: "Join" });

  expect(join).toBeDisabled();

  await user.type(screen.getByPlaceholderText("Invitation code"), "K7X9-QP2M");
  expect(join).toBeDisabled();

  await user.type(screen.getByPlaceholderText("Password"), "invite-pass");
  expect(join).toBeEnabled();
});

it("treats whitespace-only input as empty", async () => {
  const { user } = renderJoin();
  await fillIn(user, "   ", "   ");

  expect(screen.getByRole("button", { name: "Join" })).toBeDisabled();
});

it("submits the code and password as typed", async () => {
  resolveWith();
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "invite-pass");
  await submit(user);

  await waitFor(() =>
    expect(joinPartyMock).toHaveBeenCalledWith({
      code: "K7X9-QP2M",
      password: "invite-pass",
    })
  );
});

it("navigates to the party hub once the join succeeds", async () => {
  resolveWith();
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "invite-pass");
  await submit(user);

  await waitFor(() =>
    expect(screen.getByTestId("location")).toHaveTextContent("/party")
  );
});

it("shows a loading label while the join is in flight", async () => {
  let release: () => void = () => undefined;
  joinPartyMock.mockReturnValue(
    () => new Promise<void>((resolve) => { release = resolve; })
  );
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "invite-pass");
  await submit(user);

  expect(await screen.findByRole("button", { name: "Joining…" })).toBeDisabled();
  release();
});

it("explains a wrong password without technical wording (EC-7)", async () => {
  rejectWith(SYNC_ERROR_CODES.INVITATION_WRONG_PASSWORD);
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "wrong");
  await submit(user);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "That password doesn't match this invitation."
  );
});

it("keeps the entered values after a wrong password so a retry is one edit away", async () => {
  rejectWith(SYNC_ERROR_CODES.INVITATION_WRONG_PASSWORD);
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "wrong");
  await submit(user);
  await screen.findByRole("alert");

  // Safe to keep them because the server does not consume the invitation on
  // a wrong password; clearing the form would imply the invite was spent.
  expect(screen.getByPlaceholderText("Invitation code")).toHaveValue("K7X9-QP2M");
  expect(screen.getByRole("button", { name: "Join" })).toBeEnabled();
});

it("explains a spent invitation (EC-8)", async () => {
  rejectWith(SYNC_ERROR_CODES.INVITATION_USED);
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "invite-pass");
  await submit(user);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This invitation has already been used."
  );
});

it("explains an unknown code", async () => {
  rejectWith(SYNC_ERROR_CODES.INVITATION_NOT_FOUND);
  const { user } = renderJoin();
  await fillIn(user, "AAAA-AAAA", "invite-pass");
  await submit(user);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "That invitation code doesn't exist."
  );
});

it("explains already belonging to a party (EC-6)", async () => {
  rejectWith(SYNC_ERROR_CODES.ALREADY_IN_PARTY);
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "invite-pass");
  await submit(user);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "You already belong to a party."
  );
});

it("falls back to the server's message for a code it has no copy for", async () => {
  rejectWith(SYNC_ERROR_CODES.NETWORK_ERROR, "Couldn't reach the sync server.");
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "invite-pass");
  await submit(user);

  // Better a server sentence than a blank alert; the screen only owns copy
  // for the invitation-specific codes.
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Couldn't reach the sync server."
  );
});

it("stays on the join screen when the join fails", async () => {
  rejectWith(SYNC_ERROR_CODES.INVITATION_USED);
  const { user } = renderJoin();
  await fillIn(user, "K7X9-QP2M", "invite-pass");
  await submit(user);
  await screen.findByRole("alert");

  expect(screen.getByTestId("location")).toHaveTextContent("/party/join");
});

it("cancels back to the party hub without joining", async () => {
  const { user } = renderJoin();

  await user.click(screen.getByRole("button", { name: "Cancel" }));

  expect(screen.getByTestId("location")).toHaveTextContent("/party");
  expect(joinPartyMock).not.toHaveBeenCalled();
});
