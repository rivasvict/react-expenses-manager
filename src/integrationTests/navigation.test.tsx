import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, FEBRUARY, MARCH, APRIL, MAY, NOVEMBER } from "./helpers/seed";

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
      { date: ts(2026, MAY), amount: "100", type: "income", categories_path: ",salary," },
    ]);

    await renderApp("/");

    expect(await screen.findByText("May 2026")).toBeInTheDocument();
  });

  it("shows a Prev button when a previous month has data", async () => {
    // Seed entry in February 2026 — getEntriesWithFilledDates will fill
    // Feb, Mar, Apr, May 2026 so Prev is available from May
    seedEntries([
      { date: ts(2026, FEBRUARY), amount: "500", type: "income", categories_path: ",salary," },
    ]);

    await renderApp("/");

    expect(await screen.findByRole("button", { name: /prev/i })).toBeInTheDocument();
  });

  it("navigates to the previous month when Prev is clicked and shows correct sums", async () => {
    seedEntries([
      // February
      { date: ts(2026, FEBRUARY), amount: "1000", type: "income",  categories_path: ",salary,",     description: "Feb Salary" },
      { date: ts(2026, FEBRUARY), amount: "200",  type: "income",  categories_path: ",deposit,",    description: "Feb Bonus" },
      { date: ts(2026, FEBRUARY), amount: "150",  type: "expense", categories_path: ",food,",       description: "Feb Groceries" },
      { date: ts(2026, FEBRUARY), amount: "50",   type: "expense", categories_path: ",eating out,", description: "Feb Dinner" },
      // March
      { date: ts(2026, MARCH), amount: "1100", type: "income",  categories_path: ",salary,",     description: "Mar Salary" },
      { date: ts(2026, MARCH), amount: "300",  type: "income",  categories_path: ",deposit,",    description: "Mar Bonus" },
      { date: ts(2026, MARCH), amount: "180",  type: "expense", categories_path: ",food,",       description: "Mar Groceries" },
      { date: ts(2026, MARCH), amount: "70",   type: "expense", categories_path: ",eating out,", description: "Mar Dinner" },
      // April
      { date: ts(2026, APRIL), amount: "1200", type: "income",  categories_path: ",salary,",     description: "Apr Salary" },
      { date: ts(2026, APRIL), amount: "400",  type: "income",  categories_path: ",deposit,",    description: "Apr Bonus" },
      { date: ts(2026, APRIL), amount: "210",  type: "expense", categories_path: ",food,",       description: "Apr Groceries" },
      { date: ts(2026, APRIL), amount: "90",   type: "expense", categories_path: ",eating out,", description: "Apr Dinner" },
      // May
      { date: ts(2026, MAY), amount: "1300", type: "income",  categories_path: ",salary,",     description: "May Salary" },
      { date: ts(2026, MAY), amount: "500",  type: "income",  categories_path: ",deposit,",    description: "May Bonus" },
      { date: ts(2026, MAY), amount: "240",  type: "expense", categories_path: ",food,",       description: "May Groceries" },
      { date: ts(2026, MAY), amount: "110",  type: "expense", categories_path: ",eating out,", description: "May Dinner" },
    ]);

    const { user } = await renderApp("/");

    // May: incomes $1,800 | expenses $350 | savings $1,450
    await screen.findByText("May 2026");
    expect(await screen.findByText("$1,800.00")).toBeInTheDocument();
    expect(screen.getByText("$350.00")).toBeInTheDocument();
    expect(screen.getAllByText(/\$1,450\.00/).length).toBeGreaterThan(0);

    // → April: incomes $1,600 | expenses $300 | savings $1,300
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("April 2026");
    expect(await screen.findByText("$1,600.00")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    expect(screen.getAllByText(/\$1,300\.00/).length).toBeGreaterThan(0);

    // → March: incomes $1,400 | expenses $250 | savings $1,150
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("March 2026");
    expect(await screen.findByText("$1,400.00")).toBeInTheDocument();
    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getAllByText(/\$1,150\.00/).length).toBeGreaterThan(0);

    // → February: incomes $1,200 | expenses $200 | savings $1,000
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("February 2026");
    expect(await screen.findByText("$1,200.00")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getAllByText(/\$1,000\.00/).length).toBeGreaterThan(0);
  });

  it("navigates forward with Next after going back", async () => {
    seedEntries([
      { date: ts(2026, FEBRUARY), amount: "500", type: "income", categories_path: ",salary," },
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
      { date: ts(2025, NOVEMBER), amount: "200", type: "expense", categories_path: ",food," },
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
