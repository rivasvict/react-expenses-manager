import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { SYNC_PENDING_REVIEW_SET } from "../../redux/syncManager/actions";
import { PendingReview } from "../../redux/syncManager/reducer";
import {
  clearPendingReview,
  completeReview,
  syncWithParty,
} from "../../redux/syncManager/syncThunk";
import { refreshMe } from "../../redux/syncManager/actionCreators";
import {
  SYNC_ERROR_CODES,
  createSyncApiError,
} from "../../services/syncApi/contract";
import SyncReview from "./index";

/**
 * Unit tests for the /sync-review wizard (docs/multi-user-sync/DESIGN.md
 * §4.3). The thunks are mocked, so these assert the screen's own job:
 * walking the staged items one at a time, turning decisions into the
 * accepted/rejected sets handed to `completeReview`, and the safe
 * abandonment paths (cancel, conflict) that never touch local data. The
 * end-to-end behaviour (what actually gets merged and uploaded) lives in
 * src/integrationTests/syncWizard*.test.tsx.
 */

jest.mock("../../redux/syncManager/syncThunk", () => ({
  clearPendingReview: jest.fn(),
  completeReview: jest.fn(),
  syncWithParty: jest.fn(),
}));
jest.mock("../../redux/syncManager/actionCreators", () => ({
  refreshMe: jest.fn(),
}));

const clearPendingReviewMock = clearPendingReview as unknown as jest.Mock;
const completeReviewMock = completeReview as unknown as jest.Mock;
const syncWithPartyMock = syncWithParty as unknown as jest.Mock;
const refreshMeMock = refreshMe as unknown as jest.Mock;

let confirmSpy: jest.SpyInstance;

const tomsCinema = {
  key: "entry:e2",
  hash: "hash-cinema",
  kind: "entry" as const,
  isChange: false,
  entry: {
    id: "e2",
    date: 1747396800000,
    amount: "42.1",
    description: "Cinema",
    type: "expense",
    categories_path: ",eating out,",
    addedBy: { id: "user-2", name: "Tom" },
  },
};

const tomsSalary = {
  key: "entry:e3",
  hash: "hash-salary",
  kind: "entry" as const,
  isChange: false,
  entry: {
    id: "e3",
    date: 1747310400000,
    amount: "1500",
    description: "Salary",
    type: "income",
    categories_path: ",salary,",
    addedBy: { id: "user-2", name: "Tom" },
  },
};

const stagedReview = (items = [tomsCinema, tomsSalary]): PendingReview => ({
  items,
  baseVersion: "3",
});

const renderReview = (pendingReview: PendingReview | null) => {
  const store = setupStore();
  store.dispatch({
    type: SYNC_PENDING_REVIEW_SET,
    payload: { pendingReview },
  });
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/sync-review"]}>
        <SyncReview />
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

// The accepted/rejected sets the last completeReview call was given.
const lastCompletion = () =>
  completeReviewMock.mock.calls[completeReviewMock.mock.calls.length - 1][0];

beforeEach(() => {
  window.localStorage.clear();
  clearPendingReviewMock.mockReset();
  // The component dispatches the mocked thunk's return value; a plain
  // action keeps redux happy.
  clearPendingReviewMock.mockReturnValue({ type: "CLEAR_PENDING_REVIEW_MOCK" });
  refreshMeMock.mockReset();
  refreshMeMock.mockReturnValue({ type: "REFRESH_ME_MOCK" });
  // With redux-thunk a returned function is invoked and its promise handed
  // back to the component.
  completeReviewMock.mockReset();
  completeReviewMock.mockReturnValue(() => Promise.resolve());
  syncWithPartyMock.mockReset();
  confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  confirmSpy.mockRestore();
});

describe("with nothing staged", () => {
  it("explains there is nothing to review and links back to Data Management", () => {
    // Reached directly by URL, or after a reload: the staged set lives in
    // Redux only.
    renderReview(null);

    expect(
      screen.getByText(/There's nothing to review right now/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to Data Management" })
    ).toHaveAttribute("href", "/data-management");
  });
});

describe("walking the items", () => {
  it("shows the first item with its facts, attribution and progress", () => {
    renderReview(stagedReview());

    expect(screen.getByText("Item 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("$42.10")).toBeInTheDocument();
    expect(screen.getByText("Cinema")).toBeInTheDocument();
    expect(screen.getByText("eating out")).toBeInTheDocument();
    expect(screen.getByText("Added by Tom")).toBeInTheDocument();
  });

  it("advances after each decision and reaches the summary after the last", async () => {
    const { user } = renderReview(stagedReview());

    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );

    expect(screen.getByText("Item 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Reject $1500.00 income added by tom" })
    );

    expect(screen.getByText("Review complete")).toBeInTheDocument();
    expect(
      screen.getByText("1 accepted · 0 modified · 1 rejected")
    ).toBeInTheDocument();
  });

  it("Accept all / Reject all act on the remaining items behind a confirmation", async () => {
    const { user } = renderReview(stagedReview());
    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );

    await user.click(screen.getByRole("button", { name: "Reject all" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Reject the remaining 1 items without reviewing them individually?"
    );
    expect(
      screen.getByText("1 accepted · 0 modified · 1 rejected")
    ).toBeInTheDocument();
  });

  it("a declined bulk confirmation changes nothing", async () => {
    confirmSpy.mockReturnValue(false);
    const { user } = renderReview(stagedReview());

    await user.click(screen.getByRole("button", { name: "Accept all" }));

    expect(screen.getByText("Item 1 of 2")).toBeInTheDocument();
  });
});

describe("Modify (DESIGN §4.3.2, EC-5)", () => {
  it("stages the edited values as an accepted, modified item", async () => {
    const { user } = renderReview(stagedReview([tomsCinema]));

    await user.click(
      screen.getByRole("button", { name: "Modify $42.10 expense added by tom" })
    );
    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "50");
    await user.click(screen.getByRole("button", { name: "Save & accept" }));

    expect(
      screen.getByText("0 accepted · 1 modified · 0 rejected")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    await waitFor(() => expect(completeReviewMock).toHaveBeenCalledTimes(1));
    expect(lastCompletion().acceptedItems[0].entry.amount).toBe("50");
  });

  it("Cancel returns to the read-only card without recording a decision", async () => {
    const { user } = renderReview(stagedReview([tomsCinema]));

    await user.click(
      screen.getByRole("button", { name: "Modify $42.10 expense added by tom" })
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Item 1 of 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    ).toBeInTheDocument();
  });
});

describe("upload (DESIGN §4.3.4)", () => {
  it("hands the accepted items, rejected hashes and baseVersion to completeReview", async () => {
    const { user } = renderReview(stagedReview());
    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );
    await user.click(
      screen.getByRole("button", { name: "Reject $1500.00 income added by tom" })
    );

    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    await waitFor(() => expect(completeReviewMock).toHaveBeenCalledTimes(1));
    expect(lastCompletion()).toEqual({
      acceptedItems: [tomsCinema],
      rejectedItems: [{ key: tomsSalary.key, hash: tomsSalary.hash }],
      baseVersion: "3",
    });
    expect(
      await screen.findByText("Synced! Your party is up to date.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/data-management");
  });

  it("a network failure keeps the staged set and offers Retry", async () => {
    completeReviewMock
      .mockReturnValueOnce(() =>
        Promise.reject(
          createSyncApiError({
            code: SYNC_ERROR_CODES.NETWORK_ERROR,
            message: "offline",
          })
        )
      )
      .mockReturnValueOnce(() => Promise.resolve());
    const { user } = renderReview(stagedReview([tomsCinema]));
    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );

    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't save your changes to your party. Check your connection and try again."
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByText("Synced! Your party is up to date.")
    ).toBeInTheDocument();
    // The same decisions were re-sent — no re-review.
    expect(completeReviewMock).toHaveBeenCalledTimes(2);
    expect(completeReviewMock.mock.calls[1][0]).toEqual(
      completeReviewMock.mock.calls[0][0]
    );
  });

  it("a version conflict discards the decisions and offers Sync again", async () => {
    completeReviewMock.mockReturnValue(() =>
      Promise.reject(
        createSyncApiError({
          code: SYNC_ERROR_CODES.VERSION_CONFLICT,
          message: "The party backup changed since your download.",
        })
      )
    );
    syncWithPartyMock.mockReturnValue(() =>
      Promise.resolve({ type: "review", incomingCount: 1 })
    );
    const { user } = renderReview(stagedReview([tomsCinema]));
    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );

    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your party synced new changes while you were reviewing."
    );
    await user.click(screen.getByRole("button", { name: "Sync again" }));

    await waitFor(() => expect(syncWithPartyMock).toHaveBeenCalledTimes(1));
    // Fresh review of whatever the new download staged — from item one.
    expect(await screen.findByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/sync-review");
  });
});

describe("Cancel review", () => {
  it("asks for confirmation and does nothing when declined", async () => {
    confirmSpy.mockReturnValue(false);
    const { user } = renderReview(stagedReview());

    await user.click(screen.getByRole("button", { name: "Cancel review" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime."
    );
    expect(clearPendingReviewMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/sync-review");
  });

  it("clears the pending review and returns to Data Management when confirmed", async () => {
    const { user } = renderReview(stagedReview());

    await user.click(screen.getByRole("button", { name: "Cancel review" }));

    expect(clearPendingReviewMock).toHaveBeenCalledTimes(1);
    expect(completeReviewMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/data-management");
  });
});
