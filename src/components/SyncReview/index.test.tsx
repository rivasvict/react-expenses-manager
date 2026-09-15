import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Link, MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { SYNC_PENDING_REVIEW_SET } from "../../redux/syncManager/actions";
import { PendingReview } from "../../redux/syncManager/reducer";
import { IncomingItem } from "../../helpers/syncMergeHelper/syncMergeHelper";
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

// A fixed entry this device has never seen, as it arrives: every history
// state of the definition (RFC §4.1).
const netflixState = (from: string, amount: string) => ({
  key: `fixed:f1:${from}`,
  hash: `hash-f1-${from}`,
  kind: "fixed" as const,
  isChange: false,
  isNewDefinition: true,
  fixed: {
    id: "f1",
    type: "expense",
    state: {
      from,
      amount,
      description: "Netflix",
      categories_path: ",fun,",
      addedBy: { id: "user-2", name: "Tom" },
    },
  },
});

const netflixHistory = [
  netflixState("2026-01", "9"),
  netflixState("2026-03", "11"),
  netflixState("2026-05", "13"),
];

const stagedReview = (
  items: IncomingItem[] = [tomsCinema, tomsSalary]
): PendingReview => ({
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
      <MemoryRouter
        initialEntries={["/sync-review"]}
        // What BrowserRouter uses by default; memory history has none.
        getUserConfirmation={(message, callback) =>
          callback(window.confirm(message))
        }
      >
        <SyncReview />
        {/* Stands in for the Dashboard nav bar the wizard renders inside. */}
        <Link to="/dashboard">Home</Link>
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

describe("a brand-new fixed entry / bucket (RFC §4.1)", () => {
  it("is one card showing its current state, not one card per history state", () => {
    renderReview(stagedReview(netflixHistory));

    expect(screen.getByText("Item 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("$13.00")).toBeInTheDocument();
    expect(screen.getByText("From 2026-05")).toBeInTheDocument();
    expect(
      screen.getByText(
        "New here — your decision covers its full history (3 changes)."
      )
    ).toBeInTheDocument();
  });

  it("applies one Accept to every one of its states", async () => {
    const { user } = renderReview(stagedReview(netflixHistory));

    await user.click(
      screen.getByRole("button", {
        name: "Accept $13.00 fixed expense added by tom",
      })
    );
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    await waitFor(() => expect(completeReviewMock).toHaveBeenCalledTimes(1));
    expect(lastCompletion().acceptedItems).toEqual(netflixHistory);
    expect(lastCompletion().rejectedItems).toEqual([]);
    // One decision, counted once.
    expect(screen.queryByText("Item 2 of 3")).not.toBeInTheDocument();
  });

  it("applies one Reject to every one of its states", async () => {
    const { user } = renderReview(stagedReview(netflixHistory));

    await user.click(
      screen.getByRole("button", {
        name: "Reject $13.00 fixed expense added by tom",
      })
    );
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    await waitFor(() => expect(completeReviewMock).toHaveBeenCalledTimes(1));
    expect(lastCompletion().acceptedItems).toEqual([]);
    expect(lastCompletion().rejectedItems).toEqual(
      netflixHistory.map((item) => ({ key: item.key, hash: item.hash }))
    );
  });

  it("stages a modification on the current state and the rest untouched", async () => {
    const { user } = renderReview(stagedReview(netflixHistory));

    await user.click(
      screen.getByRole("button", {
        name: "Modify $13.00 fixed expense added by tom",
      })
    );
    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "15");
    await user.click(screen.getByRole("button", { name: "Save & accept" }));
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    await waitFor(() => expect(completeReviewMock).toHaveBeenCalledTimes(1));
    expect(
      lastCompletion().acceptedItems.map((item: any) => item.fixed.state.amount)
    ).toEqual(["9", "11", "15"]);
  });

  it("keeps an edit to a definition this device already has as its own card", () => {
    const edits = netflixHistory
      .slice(1)
      .map((item) => ({ ...item, isNewDefinition: false }));
    renderReview(stagedReview(edits));

    expect(screen.getByText("Item 1 of 2")).toBeInTheDocument();
    expect(
      screen.queryByText(/your decision covers its full history/)
    ).not.toBeInTheDocument();
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

  it("keeps the original time of day when the date field was not touched", async () => {
    const { user } = renderReview(stagedReview([tomsCinema]));

    await user.click(
      screen.getByRole("button", { name: "Modify $42.10 expense added by tom" })
    );
    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);
    await user.type(amount, "50");
    await user.click(screen.getByRole("button", { name: "Save & accept" }));
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    await waitFor(() => expect(completeReviewMock).toHaveBeenCalledTimes(1));
    // Not silently rewritten to local midnight, which would re-sync to
    // every member as a change the user never made.
    expect(lastCompletion().acceptedItems[0].entry.date).toBe(
      tomsCinema.entry.date
    );
  });

  it("refuses to save an empty date", async () => {
    const { user } = renderReview(stagedReview([tomsCinema]));

    await user.click(
      screen.getByRole("button", { name: "Modify $42.10 expense added by tom" })
    );
    await user.clear(screen.getByLabelText("Date"));

    expect(screen.getByText("Enter a date.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save & accept" })).toBeDisabled();
  });

  it("refuses to save an empty or non-numeric amount", async () => {
    const { user } = renderReview(stagedReview([tomsCinema]));

    await user.click(
      screen.getByRole("button", { name: "Modify $42.10 expense added by tom" })
    );
    const amount = screen.getByLabelText("Amount");
    await user.clear(amount);

    expect(screen.getByText("Enter a number.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save & accept" })).toBeDisabled();

    await user.type(amount, "12");
    expect(
      screen.getByRole("button", { name: "Save & accept" })
    ).not.toBeDisabled();
  });

  it("names the Category combobox for assistive tech", async () => {
    const { user } = renderReview(stagedReview([tomsCinema]));

    await user.click(
      screen.getByRole("button", { name: "Modify $42.10 expense added by tom" })
    );

    expect(screen.getByRole("combobox", { name: "Category" })).toBeInTheDocument();
  });

  it("shows a category this device does not have, and keeps it byte for byte", async () => {
    const foreign = {
      ...tomsCinema,
      entry: { ...tomsCinema.entry, categories_path: ",Pets," },
    };
    const { user } = renderReview(stagedReview([foreign]));

    await user.click(
      screen.getByRole("button", { name: "Modify $42.10 expense added by tom" })
    );

    // Not "Select a category", which would hide the real value behind a
    // blank field one click away from being replaced.
    expect(screen.getByRole("combobox", { name: "Category" })).toHaveTextContent(
      "Pets"
    );

    await user.click(screen.getByRole("button", { name: "Save & accept" }));
    await user.click(screen.getByRole("button", { name: "Upload & finish" }));

    await waitFor(() => expect(completeReviewMock).toHaveBeenCalledTimes(1));
    expect(lastCompletion().acceptedItems[0].entry.categories_path).toBe(
      ",Pets,"
    );
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

  it("asks only once — the route guard lets the wizard's own exit through", async () => {
    const { user } = renderReview(stagedReview());
    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );

    await user.click(screen.getByRole("button", { name: "Cancel review" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });
});

describe("leaving through the app nav (AC-3.11)", () => {
  it("asks the same question as Cancel review before discarding decisions", async () => {
    const { user } = renderReview(stagedReview());
    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime."
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("stays on the wizard with the decisions intact when declined", async () => {
    confirmSpy.mockReturnValue(false);
    const { user } = renderReview(stagedReview());
    await user.click(
      screen.getByRole("button", { name: "Accept $42.10 expense added by tom" })
    );

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/sync-review");
    expect(screen.getByText("Item 2 of 2")).toBeInTheDocument();
  });

  it("does not ask when nothing has been decided yet", async () => {
    const { user } = renderReview(stagedReview());

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });
});
