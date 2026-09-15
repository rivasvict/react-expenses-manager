import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { SYNC_PENDING_REVIEW_SET } from "../../redux/syncManager/actions";
import { clearPendingReview } from "../../redux/syncManager/syncThunk";
import SyncReview from "./index";

/**
 * Unit tests for the /sync-review placeholder. The thunk is mocked, so
 * these assert the screen's own job: reporting how many changes are waiting
 * and offering a Cancel that — after an explicit confirmation — clears the
 * pending review and returns to Data Management without touching anything
 * (docs/multi-user-sync/DESIGN.md §4.3 safe abandonment).
 */

jest.mock("../../redux/syncManager/syncThunk", () => ({
  clearPendingReview: jest.fn(),
}));

const clearPendingReviewMock = clearPendingReview as unknown as jest.Mock;

let confirmSpy: jest.SpyInstance;

const renderReview = (pendingReviewCount: number | null) => {
  const store = setupStore();
  store.dispatch({
    type: SYNC_PENDING_REVIEW_SET,
    payload: { pendingReviewCount },
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

beforeEach(() => {
  window.localStorage.clear();
  clearPendingReviewMock.mockReset();
  // The component dispatches the mocked thunk's return value; a plain
  // action keeps redux happy.
  clearPendingReviewMock.mockReturnValue({ type: "CLEAR_PENDING_REVIEW_MOCK" });
  confirmSpy = jest.spyOn(window, "confirm");
});

afterEach(() => {
  confirmSpy.mockRestore();
});

it("reports a single incoming change in the singular", () => {
  renderReview(1);

  expect(screen.getByText(/1 incoming change to review/)).toBeInTheDocument();
});

it("reports several incoming changes in the plural", () => {
  renderReview(3);

  expect(screen.getByText(/3 incoming changes to review/)).toBeInTheDocument();
});

it("falls back to a countless message when no review count is known", () => {
  // Reached directly by URL, or after a reload: the count lives in Redux
  // only, so there is nothing to show but the fact that a review exists.
  renderReview(null);

  expect(
    screen.getByText(/Your party has changes to review\./)
  ).toBeInTheDocument();
});

it("asks for confirmation before canceling and does nothing when declined", async () => {
  confirmSpy.mockReturnValue(false);
  const { user } = renderReview(2);

  await user.click(screen.getByRole("button", { name: "Cancel review" }));

  expect(confirmSpy).toHaveBeenCalledWith(
    "Stop reviewing? None of your choices in this session will be saved. You can sync again anytime."
  );
  expect(clearPendingReviewMock).not.toHaveBeenCalled();
  expect(screen.getByTestId("location")).toHaveTextContent("/sync-review");
});

it("clears the pending review and returns to Data Management when confirmed", async () => {
  confirmSpy.mockReturnValue(true);
  const { user } = renderReview(2);

  await user.click(screen.getByRole("button", { name: "Cancel review" }));

  expect(clearPendingReviewMock).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("location")).toHaveTextContent("/data-management");
});
