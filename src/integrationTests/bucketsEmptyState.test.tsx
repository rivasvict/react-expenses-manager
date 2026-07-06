import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";

// Pinned so the navigable month header (when present) reads a stable month.
const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("buckets empty state (issue #105)", () => {
  it("shows the empty state when no buckets exist by default", async () => {
    // No buckets are seeded into localStorage: a fresh user starts with none
    // now that the default-seeded buckets have been removed.
    await renderApp("/buckets");

    expect(await screen.findByTestId("buckets-empty-state")).toBeInTheDocument();
    expect(screen.getByText(/no buckets yet/i)).toBeInTheDocument();
    expect(screen.getByAltText(/no buckets yet/i)).toBeInTheDocument();

    // The bucket list / summary header is not rendered in the empty state.
    expect(screen.queryByText(/allocation:/i)).not.toBeInTheDocument();
  });

  it("keeps the 'Add new bucket' action available in the empty state", async () => {
    await renderApp("/buckets");

    await screen.findByTestId("buckets-empty-state");
    expect(
      screen.getByRole("link", { name: /add new bucket/i })
    ).toBeInTheDocument();
  });

  it("renders the bucket list instead of the empty state once a bucket exists", async () => {
    localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));
    await renderApp("/buckets");

    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.queryByTestId("buckets-empty-state")).not.toBeInTheDocument();
    expect(screen.getByText(/allocation:/i)).toBeInTheDocument();
  });
});
