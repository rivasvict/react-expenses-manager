import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../redux/store";
import {
  createParty,
  refreshMe,
} from "../../redux/syncManager/actionCreators";
import { SYNC_PARTY_SET, SYNC_SESSION_SET } from "../../redux/syncManager/actions";
import { Party as PartyShape } from "../../services/syncApi/contract";
import { SyncSession } from "../../services/session";
import Party from ".";

/**
 * Unit tests for the party hub (docs/multi-user-sync/DESIGN.md §3). The
 * thunks are mocked, so these assert the hub's own job: choosing which view
 * to render from session/party/partyStatusResolved, and confirming before creating.
 */

jest.mock("../../redux/syncManager/actionCreators", () => ({
  createParty: jest.fn(),
  refreshMe: jest.fn(),
}));

const createPartyMock = createParty as unknown as jest.Mock;
const refreshMeMock = refreshMe as unknown as jest.Mock;

const jane: SyncSession = {
  token: "token-for-jane",
  user: {
    id: "u1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  },
};

const janesParty: PartyShape = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: jane.user.id,
  canceled: false,
  youAreBlocked: false,
  members: [
    {
      id: jane.user.id,
      firstName: "Jane",
      lastName: "Doe",
      email: jane.user.email,
      blocked: false,
    },
  ],
};

// Drives the store into the state under test rather than stubbing the slice,
// so these exercise the same selectors the app uses.
const renderHub = ({
  session = null as SyncSession | null,
  party = null as PartyShape | null,
  partyStatusResolved = false,
} = {}) => {
  const user = userEvent.setup();
  const store = setupStore();
  if (session) store.dispatch({ type: SYNC_SESSION_SET, payload: { session } });
  if (partyStatusResolved) store.dispatch({ type: SYNC_PARTY_SET, payload: { party } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/party"]}>
        <Party />
      </MemoryRouter>
    </Provider>
  );
  return { user };
};

let confirmSpy: jest.SpyInstance;

beforeEach(() => {
  createPartyMock.mockReset();
  refreshMeMock.mockReset();
  refreshMeMock.mockReturnValue({ type: "NOOP" });
  createPartyMock.mockReturnValue(() => Promise.resolve(janesParty));
  confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  confirmSpy.mockRestore();
});

it("refreshes membership from the server on mount", async () => {
  renderHub({ session: jane, partyStatusResolved: true });

  // RFC §2.2 (docs/multi-user-sync/RFC.md): party state is never cached as
  // authoritative, so the hub asks rather than trusting what it was given.
  await waitFor(() => expect(refreshMeMock).toHaveBeenCalled());
});

it("asks a signed-out visitor to sign in, offering no party actions", () => {
  renderHub();

  expect(screen.getByText("Sign in to create or join a party.")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Create a party" })
  ).not.toBeInTheDocument();
});

it("shows a loading state before the first refresh answers", () => {
  renderHub({ session: jane });

  // "Not asked yet" must not look like "no party", or a returning member
  // would be offered a second party for as long as the request takes.
  expect(screen.getByRole("status")).toHaveTextContent("Loading your party…");
  expect(
    screen.queryByRole("button", { name: "Create a party" })
  ).not.toBeInTheDocument();
});

it("offers create and join once the refresh reports no party", () => {
  renderHub({ session: jane, partyStatusResolved: true });

  expect(
    screen.getByRole("button", { name: "Create a party" })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Join a party" })).toBeInTheDocument();
});

it("shows the party detail once there is a party", () => {
  renderHub({ session: jane, party: janesParty, partyStatusResolved: true });

  expect(
    screen.getByRole("heading", { name: "Jane's Party" })
  ).toBeInTheDocument();
  // AC-2.2 (docs/multi-user-sync/PRD.md): no second create/join on offer.
  expect(
    screen.queryByRole("button", { name: "Create a party" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Join a party" })
  ).not.toBeInTheDocument();
});

it("confirms before creating a party", async () => {
  const { user } = renderHub({ session: jane, partyStatusResolved: true });

  await user.click(screen.getByRole("button", { name: "Create a party" }));

  expect(confirmSpy).toHaveBeenCalled();
  await waitFor(() => expect(createPartyMock).toHaveBeenCalled());
});

it("creates nothing when the confirmation is declined", async () => {
  confirmSpy.mockReturnValue(false);
  const { user } = renderHub({ session: jane, partyStatusResolved: true });

  await user.click(screen.getByRole("button", { name: "Create a party" }));

  expect(createPartyMock).not.toHaveBeenCalled();
});

it("surfaces a create failure and re-checks membership", async () => {
  createPartyMock.mockReturnValue(() =>
    Promise.reject(new Error("You already belong to a party."))
  );
  const { user } = renderHub({ session: jane, partyStatusResolved: true });

  await user.click(screen.getByRole("button", { name: "Create a party" }));

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "You already belong to a party."
  );
  // A stale tab is the likeliest cause of this failure, so the hub re-asks:
  // once on mount, and again after the rejection.
  await waitFor(() => expect(refreshMeMock.mock.calls.length).toBeGreaterThan(1));
});
