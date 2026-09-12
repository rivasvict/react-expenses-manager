import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../redux/store";
import {
  blockMember,
  cancelParty,
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
 * to render from session/party/partyStatusResolved, and confirming before
 * each membership action — create, block, cancel.
 */

jest.mock("../../redux/syncManager/actionCreators", () => ({
  blockMember: jest.fn(),
  cancelParty: jest.fn(),
  createParty: jest.fn(),
  refreshMe: jest.fn(),
}));

const blockMemberMock = blockMember as unknown as jest.Mock;
const cancelPartyMock = cancelParty as unknown as jest.Mock;
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

const janeRow = {
  id: jane.user.id,
  firstName: "Jane",
  lastName: "Doe",
  email: jane.user.email,
  blocked: false,
};

const tomRow = {
  id: "u2",
  firstName: "Tom",
  lastName: "Doe",
  email: "tom@example.com",
  blocked: false,
};

const janesParty: PartyShape = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: jane.user.id,
  canceled: false,
  youAreBlocked: false,
  members: [janeRow],
};

const janesPartyWithTom: PartyShape = {
  ...janesParty,
  members: [janeRow, tomRow],
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
  blockMemberMock.mockReset();
  cancelPartyMock.mockReset();
  createPartyMock.mockReset();
  refreshMeMock.mockReset();
  refreshMeMock.mockReturnValue({ type: "NOOP" });
  createPartyMock.mockReturnValue(() => Promise.resolve(janesParty));
  blockMemberMock.mockReturnValue(() => Promise.resolve(janesPartyWithTom));
  cancelPartyMock.mockReturnValue(() =>
    Promise.resolve({ ...janesParty, canceled: true })
  );
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

describe("blocked and canceled views (DESIGN §3.6)", () => {
  it("shows a blocked member the removed-from-party view with create and join", () => {
    renderHub({
      session: jane,
      party: { ...janesParty, youAreBlocked: true },
      partyStatusResolved: true,
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "You've been removed from this party by its organizer."
    );
    // No member list — the party is no longer theirs to look at — but both
    // ways into a new one.
    expect(
      screen.queryByRole("heading", { name: "Jane's Party" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create a party" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join a party" })).toBeInTheDocument();
  });

  it("shows a member of a canceled party the canceled view", () => {
    renderHub({
      session: jane,
      party: { ...janesParty, canceled: true },
      partyStatusResolved: true,
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Your party was canceled. Create or join a new one to sync again."
    );
    expect(
      screen.queryByRole("heading", { name: "Jane's Party" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create a party" })
    ).toBeInTheDocument();
  });

  it("tells a blocked member they were removed even if the party was then canceled", () => {
    // Both are true; the one that happened to them personally wins.
    renderHub({
      session: jane,
      party: { ...janesParty, youAreBlocked: true, canceled: true },
      partyStatusResolved: true,
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "You've been removed from this party by its organizer."
    );
  });
});

describe("blocking a member (AC-2.9)", () => {
  it("confirms with the exact copy, naming the member, before blocking", async () => {
    const { user } = renderHub({
      session: jane,
      party: janesPartyWithTom,
      partyStatusResolved: true,
    });

    await user.click(screen.getByRole("button", { name: "Block Tom Doe" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Block Tom Doe? They'll immediately lose the ability to sync. Entries they've already contributed stay in the party's history."
    );
    await waitFor(() =>
      expect(blockMemberMock).toHaveBeenCalledWith({ userId: tomRow.id })
    );
  });

  it("blocks nobody when the confirmation is declined", async () => {
    confirmSpy.mockReturnValue(false);
    const { user } = renderHub({
      session: jane,
      party: janesPartyWithTom,
      partyStatusResolved: true,
    });

    await user.click(screen.getByRole("button", { name: "Block Tom Doe" }));

    expect(blockMemberMock).not.toHaveBeenCalled();
  });

  it("surfaces a block failure and re-checks membership", async () => {
    blockMemberMock.mockReturnValue(() =>
      Promise.reject(new Error("Only the organizer can block members."))
    );
    const { user } = renderHub({
      session: jane,
      party: janesPartyWithTom,
      partyStatusResolved: true,
    });

    await user.click(screen.getByRole("button", { name: "Block Tom Doe" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only the organizer can block members."
    );
    await waitFor(() => expect(refreshMeMock.mock.calls.length).toBeGreaterThan(1));
  });
});

describe("cancelling the party (AC-2.10)", () => {
  it("confirms with the exact copy, naming the party, before cancelling", async () => {
    const { user } = renderHub({
      session: jane,
      party: janesParty,
      partyStatusResolved: true,
    });

    await user.click(screen.getByRole("button", { name: "Cancel party" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Cancel Jane's Party? No member will be able to sync afterward. Nobody's local data is deleted."
    );
    await waitFor(() => expect(cancelPartyMock).toHaveBeenCalled());
  });

  it("cancels nothing when the confirmation is declined", async () => {
    confirmSpy.mockReturnValue(false);
    const { user } = renderHub({
      session: jane,
      party: janesParty,
      partyStatusResolved: true,
    });

    await user.click(screen.getByRole("button", { name: "Cancel party" }));

    expect(cancelPartyMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Jane's Party" })
    ).toBeInTheDocument();
  });
});
