import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../../../redux/store";
import {
  SYNC_DECLINED_SET,
  SYNC_PARTY_SET,
} from "../../../../redux/syncManager/actions";
import { DeclinedReason } from "../../../../redux/syncManager/reducer";
import { refreshMe } from "../../../../redux/syncManager/actionCreators";
import { syncWithParty } from "../../../../redux/syncManager/syncThunk";
import { setSession, SyncSession } from "../../../../services/session";
import { setSyncState } from "../../../../services/syncState";
import {
  Party,
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "../../../../services/syncApi/contract";
import SyncCard from "./SyncCard";

/**
 * Unit tests for the sync card (docs/multi-user-sync/DESIGN.md §4.1–4.2).
 * The thunks are mocked, so these assert the card's own job: the gating
 * caption for each state (AC-2.11, docs/multi-user-sync/PRD.md), the
 * in-flight status, where each outcome lands, and turning each contract
 * error code into the right banner.
 */

jest.mock("../../../../redux/syncManager/actionCreators", () => ({
  refreshMe: jest.fn(),
}));
jest.mock("../../../../redux/syncManager/syncThunk", () => ({
  syncWithParty: jest.fn(),
}));

const refreshMeMock = refreshMe as unknown as jest.Mock;
const syncWithPartyMock = syncWithParty as unknown as jest.Mock;

const jane: SyncSession = {
  token: "token-for-jane",
  user: { id: "u1", email: "jane@example.com", firstName: "Jane", lastName: "Doe" },
};

const janesParty: Party = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: "u1",
  canceled: false,
  youAreBlocked: false,
  members: [],
};

// With redux-thunk a returned function is invoked and its promise handed
// back to the component.
const meCheckResolvesWith = (succeeded: boolean) =>
  refreshMeMock.mockReturnValue(() => Promise.resolve(succeeded));
const syncResolvesWith = (outcome: unknown) =>
  syncWithPartyMock.mockReturnValue(() => Promise.resolve(outcome));
const syncRejectsWith = (error: unknown) =>
  syncWithPartyMock.mockReturnValue(() => Promise.reject(error));
const apiError = (code: string, message = "Server message") =>
  createSyncApiError({ code: code as never, message });

interface RenderOptions {
  session?: SyncSession;
  // `undefined` leaves the party unresolved (no /me answer yet).
  party?: Party | null;
  // A blocked/canceled rejection the review wizard carried back.
  declined?: DeclinedReason;
}

const renderCard = ({ session, party, declined }: RenderOptions = {}) => {
  if (session) setSession(session);
  const store = setupStore();
  if (party !== undefined)
    store.dispatch({ type: SYNC_PARTY_SET, payload: { party } });
  if (declined)
    store.dispatch({ type: SYNC_DECLINED_SET, payload: { declined } });
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/data-management"]}>
        <SyncCard />
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

const syncButton = () => screen.getByRole("button", { name: /^Sync/ });

const clickSync = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Sync with party" }));

beforeEach(() => {
  window.localStorage.clear();
  refreshMeMock.mockReset();
  meCheckResolvesWith(true);
  syncWithPartyMock.mockReset();
});

describe("gating captions", () => {
  it("logged out: disabled, explains that an account and a party are needed", () => {
    renderCard();

    expect(
      screen.getByText("Sign in and join a party to sync your entries across devices.")
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
    // Nothing to refresh without a session.
    expect(refreshMeMock).not.toHaveBeenCalled();
  });

  it("signed in but party status unknown: disabled while checking", () => {
    renderCard({ session: jane });

    expect(screen.getByText("Checking your party…")).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("refreshes /me on mount when signed in", () => {
    renderCard({ session: jane });

    expect(refreshMeMock).toHaveBeenCalledTimes(1);
  });

  it("a failed party check says so instead of checking forever", async () => {
    meCheckResolvesWith(false);

    renderCard({ session: jane });

    expect(
      await screen.findByText(
        "Couldn't check your party. It will retry when you reopen this screen."
      )
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("a failed check does not override a party the store already knows", async () => {
    meCheckResolvesWith(false);

    renderCard({ session: jane, party: janesParty });

    expect(screen.getByText("Never synced yet")).toBeInTheDocument();
    await waitFor(() => expect(refreshMeMock).toHaveBeenCalled());
    expect(
      screen.queryByText(/Couldn't check your party/)
    ).not.toBeInTheDocument();
  });

  it("signed in without a party: disabled with the create/join caption", () => {
    renderCard({ session: jane, party: null });

    expect(
      screen.getByText("Create or join a party to start syncing.")
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("blocked member: disabled with the removed caption", () => {
    renderCard({ session: jane, party: { ...janesParty, youAreBlocked: true } });

    expect(
      screen.getByText(
        "You've been removed from your party by its organizer. Sync is unavailable."
      )
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("canceled party: disabled with the canceled caption", () => {
    renderCard({ session: jane, party: { ...janesParty, canceled: true } });

    expect(
      screen.getByText(
        "Your party was canceled. Create or join a new one to sync again."
      )
    ).toBeInTheDocument();
    expect(syncButton()).toBeDisabled();
  });

  it("active member who never synced: enabled with the never-synced caption", () => {
    renderCard({ session: jane, party: janesParty });

    expect(screen.getByText("Never synced yet")).toBeInTheDocument();
    expect(syncButton()).toBeEnabled();
  });

  it("active member who has synced: shows when, from the persisted sync state", () => {
    setSyncState({
      partyId: janesParty.id,
      lastSyncedVersion: "2",
      lastSyncedAt: Date.now() - 5 * 60 * 1000,
      rejections: {},
    });

    renderCard({ session: jane, party: janesParty });

    expect(screen.getByText("Last synced: 5 minutes ago")).toBeInTheDocument();
  });
});

describe("outcomes", () => {
  it("announces progress while syncing and disables the button", async () => {
    let finish!: (outcome: unknown) => void;
    syncWithPartyMock.mockReturnValue(
      () => new Promise((resolve) => (finish = resolve))
    );
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Syncing with your party…"
    );
    expect(screen.getByRole("button", { name: "Syncing…" })).toBeDisabled();

    finish({ type: "up-to-date" });
    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync with party" })).toBeEnabled();
  });

  it("first sync: shows the distinct starting-point confirmation", async () => {
    syncResolvesWith({ type: "first-sync" });
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    expect(
      await screen.findByText(
        "This is the first sync for your party. Your data is now the starting point — future syncs will compare against it."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("incoming changes: navigates to the review screen instead of a banner", async () => {
    syncResolvesWith({ type: "review", incomingCount: 2 });
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/sync-review")
    );
  });
});

describe("declined mid-review (docs/multi-user-sync/DESIGN.md §4.3.4)", () => {
  it("shows the blocked banner the wizard carried back", async () => {
    renderCard({ session: jane, party: janesParty, declined: "blocked" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sync was declined: you've been removed from your party by its organizer. Nothing on this device was changed."
    );
  });

  it("shows the canceled banner the wizard carried back", async () => {
    renderCard({ session: jane, party: janesParty, declined: "canceled" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sync was declined: your party was canceled. Nothing on this device was changed."
    );
  });

  it("a new sync attempt clears the carried-back banner", async () => {
    syncResolvesWith({ type: "up-to-date" });
    const { user } = renderCard({
      session: jane,
      party: janesParty,
      declined: "blocked",
    });
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await clickSync(user);

    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("errors", () => {
  it("BLOCKED: declined banner, then refreshes /me so the card re-gates", async () => {
    syncRejectsWith(apiError(SYNC_ERROR_CODES.BLOCKED));
    const { user } = renderCard({ session: jane, party: janesParty });
    refreshMeMock.mockClear(); // ignore the mount-time refresh

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sync was declined: you've been removed from your party by its organizer. Nothing on this device was changed."
    );
    expect(refreshMeMock).toHaveBeenCalledTimes(1);
  });

  it("PARTY_CANCELED: declined banner, then refreshes /me", async () => {
    syncRejectsWith(apiError(SYNC_ERROR_CODES.PARTY_CANCELED));
    const { user } = renderCard({ session: jane, party: janesParty });
    refreshMeMock.mockClear();

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This sync was declined: your party was canceled. Nothing on this device was changed."
    );
    expect(refreshMeMock).toHaveBeenCalledTimes(1);
  });

  it("VERSION_CONFLICT: asks to sync again", async () => {
    syncRejectsWith(apiError(SYNC_ERROR_CODES.VERSION_CONFLICT));
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your party synced new changes while you were syncing. Sync again to pick them up."
    );
  });

  it("NETWORK_ERROR: the connection banner", async () => {
    syncRejectsWith(apiError(SYNC_ERROR_CODES.NETWORK_ERROR));
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't reach your party. Check your connection and try again."
    );
  });

  it("UNSUPPORTED_SCHEMA_VERSION: names the app-version mismatch, not the connection", async () => {
    syncRejectsWith(
      apiError(
        SYNC_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
        "Unsupported backup version: 2"
      )
    );
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(
      "This device's app version is too old to read your party's data. Update the app and sync again."
    );
    expect(banner).not.toHaveTextContent("Check your connection");
  });

  it("any other contract error: shows the server's own message", async () => {
    syncRejectsWith(
      apiError(SYNC_ERROR_CODES.VALIDATION_ERROR, "A valid backup envelope is required.")
    );
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A valid backup envelope is required."
    );
  });

  it("a non-contract failure falls back to the connection banner", async () => {
    syncRejectsWith(new Error("boom"));
    const { user } = renderCard({ session: jane, party: janesParty });

    await clickSync(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't reach your party. Check your connection and try again."
    );
    // Recoverable: the button is back to a plain retry.
    expect(screen.getByRole("button", { name: "Sync with party" })).toBeEnabled();
  });

  it("a new attempt clears the previous banner", async () => {
    syncRejectsWith(apiError(SYNC_ERROR_CODES.NETWORK_ERROR));
    const { user } = renderCard({ session: jane, party: janesParty });
    await clickSync(user);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    syncResolvesWith({ type: "up-to-date" });
    await clickSync(user);

    expect(await screen.findByText("You're up to date.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
