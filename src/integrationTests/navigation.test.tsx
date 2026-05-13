import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY_2026, YEAR_2026 } from "./helpers/seed";

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("navigation", () => {
  it("shows the current month (May 2026) when opening the app", async () => {
    seedEntries([
      { date: ts(YEAR_2026, MAY_2026), amount: "100", type: "income", categories_path: ",salary," },
    ]);

    await renderApp("/");

    expect(await screen.findByText("May 2026")).toBeInTheDocument();
  });

  it("shows a Prev button when a previous month has data", async () => {
    // Seed entry in February 2026 — getEntriesWithFilledDates will fill
    // Feb, Mar, Apr, May 2026 so Prev is available from May
    seedEntries([
      { date: ts(YEAR_2026, 1), amount: "500", type: "income", categories_path: ",salary," },
    ]);

    await renderApp("/");

    expect(await screen.findByRole("button", { name: /prev/i })).toBeInTheDocument();
  });

  it("navigates to the previous month when Prev is clicked", async () => {
    seedEntries([
      { date: ts(YEAR_2026, 1), amount: "500", type: "income", categories_path: ",salary," },
    ]);

    const { user } = await renderApp("/");

    await screen.findByText("May 2026");

    // May → April → March → February
    await user.click(await screen.findByRole("button", { name: /prev/i }));
    expect(await screen.findByText("April 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /prev/i }));
    expect(await screen.findByText("March 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /prev/i }));
    expect(await screen.findByText("February 2026")).toBeInTheDocument();
  });

  it("navigates forward with Next after going back", async () => {
    seedEntries([
      { date: ts(YEAR_2026, 1), amount: "500", type: "income", categories_path: ",salary," },
    ]);

    const { user } = await renderApp("/");

    await screen.findByText("May 2026");

    // Go back one month then forward
    await user.click(await screen.findByRole("button", { name: /prev/i }));
    expect(await screen.findByText("April 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(await screen.findByText("May 2026")).toBeInTheDocument();
  });

  it("shows empty months between the earliest entry and the current month", async () => {
    // Seed a single entry in November 2025 — the app should fill Dec 2025 → May 2026 as empty months
    seedEntries([
      { date: ts(2025, 10), amount: "200", type: "expense", categories_path: ",food," },
    ]);

    const { user } = await renderApp("/");

    await screen.findByText("May 2026");

    // Navigate back through the filled empty months one by one
    const months = [
      "April 2026",
      "March 2026",
      "February 2026",
      "January 2026",
      "December 2025",
      "November 2025",
    ];

    for (const month of months) {
      await user.click(screen.getByRole("button", { name: /prev/i }));
      expect(await screen.findByText(month)).toBeInTheDocument();
    }
  });
});
