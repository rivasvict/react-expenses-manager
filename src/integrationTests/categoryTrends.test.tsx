import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, SeedEntry, ts, APRIL, OCTOBER } from "./helpers/seed";
import { LANGUAGE_STORAGE_KEY } from "../i18n/languagePreference";
import { showChange } from "./helpers/trendView";

const PINNED_DATE = new Date("2026-10-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

// What each category took in or cost, April to October 2026.
const MONTHLY: Record<string, { type: "income" | "expense"; amounts: number[] }> = {
  "Eating out": { type: "expense", amounts: [380, 420, 350, 460, 410, 520, 540] },
  Subscriptions: { type: "expense", amounts: [40, 40, 55, 55, 55, 60, 60] },
  Food: { type: "expense", amounts: [720, 700, 690, 640, 650, 610, 610] },
  Transportation: { type: "expense", amounts: [150, 140, 160, 150, 145, 150, 145] },
  Salary: { type: "income", amounts: [3200, 3200, 3200, 3200, 3200, 3200, 3200] },
  Freelance: { type: "income", amounts: [200, 0, 350, 300, 400, 500, 650] },
};

const seed = (names = Object.keys(MONTHLY)) => {
  const entries: SeedEntry[] = names.flatMap((name) =>
    MONTHLY[name].amounts.flatMap((amount, i) =>
      amount === 0
        ? []
        : [
            {
              date: ts(2026, APRIL + i),
              amount: String(amount),
              type: MONTHLY[name].type,
              categories_path: `,${name.toLowerCase()},`,
            },
          ]
    )
  );
  seedEntries(entries);
  localStorage.setItem(
    "categoryLists",
    JSON.stringify({
      expense: ["Eating out", "Subscriptions", "Food", "Transportation", "Travel"],
      income: ["Salary", "Freelance"],
    })
  );
};

const listedNames = () =>
  screen
    .getAllByRole("link", { name: /vs April|new, was/ })
    .map((row) => row.getAttribute("aria-label")?.split(",")[0]);

describe("the Savings | Categories switch", () => {
  it("sits at the top of the Savings trend and opens the category list", async () => {
    seed();
    const { user } = await renderApp("/savings-trend");

    const scope = await screen.findByRole("tablist", { name: "Trend of" });
    expect(within(scope).getByRole("tab", { name: "Savings" })).toHaveAttribute("aria-selected", "true");

    await user.click(within(scope).getByRole("tab", { name: "Categories" }));

    expect(await screen.findByRole("heading", { name: "Category trends" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Categories" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("October vs April, biggest change first.")).toBeInTheDocument();
  });

  it("keeps the range picked on Savings", async () => {
    seed();
    const { user } = await renderApp("/savings-trend");

    await user.click(await screen.findByRole("button", { name: "Last 3 months" }));
    await user.click(screen.getByRole("tab", { name: "Categories" }));

    expect(await screen.findByRole("button", { name: "Last 3 months" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("October vs July, biggest change first.")).toBeInTheDocument();
  });

  it("goes back to Savings", async () => {
    seed();
    const { user } = await renderApp("/category-trends");

    await user.click(await screen.findByRole("tab", { name: "Savings" }));
    expect(await screen.findByRole("heading", { name: "Savings trend" })).toBeInTheDocument();
  });
});

describe("the category list", () => {
  it("ranks expense categories by the size of their change", async () => {
    seed();
    await renderApp("/category-trends");

    await screen.findByText("October vs April, biggest change first.");
    expect(listedNames()).toEqual(["Subscriptions", "Eating out", "Food", "Transportation"]);
    const eatingOut = screen.getByRole("link", { name: "Eating out, $540.00, +42% vs April" });
    expect(eatingOut).toHaveTextContent("was $380.00");
    expect(eatingOut).toHaveTextContent("42%");
  });

  it("leaves out a category with nothing in the range", async () => {
    seed();
    await renderApp("/category-trends");

    await screen.findByText("October vs April, biggest change first.");
    expect(screen.queryByRole("link", { name: /^Travel/ })).not.toBeInTheDocument();
  });

  it("lists income categories under Incomes", async () => {
    seed();
    const { user } = await renderApp("/category-trends");

    await user.click(await screen.findByRole("tab", { name: "Incomes" }));
    expect(listedNames()).toEqual(["Freelance", "Salary"]);
    expect(screen.getByRole("link", { name: "Freelance, $650.00, +225% vs April" })).toBeInTheDocument();
  });

  it("says so, and offers to add an expense, when the range has no expenses", async () => {
    seed(["Salary"]);
    const { user } = await renderApp("/category-trends");

    expect(await screen.findByText("No expenses between April and October")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(await screen.findByText("Expense entry")).toBeInTheDocument();
  });

  it("shows the list in Spanish, with category names as stored", async () => {
    seed();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    await renderApp("/category-trends");

    expect(await screen.findByText("Octubre frente a abril, mayor cambio primero.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Categorías" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("link", { name: /^Eating out, \$540\.00/ })).toHaveTextContent("antes $380.00");
  });
});

describe("one category's trend", () => {
  it("opens from the list on Per month: the range's total and monthly average", async () => {
    seed();
    const { user } = await renderApp("/category-trends");

    await user.click(await screen.findByRole("link", { name: /^Eating out/ }));

    const headline = await screen.findByRole("group", { name: "Eating out, Apr – Oct" });
    expect(headline).toHaveTextContent("$3,080.00");
    expect(headline).toHaveTextContent("7 months · $440.00 avg per month");
    expect(screen.getByRole("tab", { name: "Per month" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Each point is what you spent on this category in that month.")).toBeInTheDocument();
  });

  it("compares the end month with the first month on Change, a rise in spending in red", async () => {
    seed();
    const { user } = await renderApp("/category-trends/expense/Eating%20out");

    await showChange(user);
    const headline = await screen.findByRole("group", { name: "Eating out, October vs April" });
    expect(headline).toHaveTextContent("+$160.00");
    expect(within(headline).getByText("+42.1%")).toHaveClass("change-pill--bad");
    expect(headline).toHaveTextContent("$540.00 vs $380.00");
    expect(
      screen.getByText("Green where you spent less than in April, red where you spent more.")
    ).toBeInTheDocument();
  });

  it("shows less spent on an expense category in green, in the list and on Change", async () => {
    seed();
    const { user } = await renderApp("/category-trends");

    const row = await screen.findByRole("link", { name: "Food, $610.00, −15% vs April" });
    expect(within(row).getByText("−15%")).toHaveClass("change-pill--good");

    await user.click(row);
    await showChange(user);
    const headline = await screen.findByRole("group", { name: "Food, October vs April" });
    expect(headline).toHaveTextContent("−$110.00");
    expect(within(headline).getByText("−15.3%")).toHaveClass("change-pill--good");
    expect(headline).toHaveTextContent("$610.00 vs $720.00");
  });

  it("shows a rise in an income category in green", async () => {
    seed();
    const { user } = await renderApp("/category-trends/income/Freelance");

    await showChange(user);
    const headline = await screen.findByRole("group", { name: "Freelance, October vs April" });
    expect(headline).toHaveTextContent("+$450.00");
    expect(within(headline).getByText("+225.0%")).toHaveClass("change-pill--good");
  });

  it("shows less earned on an income category in red, in the list and on Change", async () => {
    seedEntries([
      { date: ts(2026, APRIL), amount: "500", type: "income", categories_path: ",bonus," },
      { date: ts(2026, OCTOBER), amount: "300", type: "income", categories_path: ",bonus," },
    ]);
    localStorage.setItem("categoryLists", JSON.stringify({ expense: [], income: ["Bonus"] }));
    const { user } = await renderApp("/category-trends");

    await user.click(await screen.findByRole("tab", { name: "Incomes" }));
    const row = screen.getByRole("link", { name: "Bonus, $300.00, −40% vs April" });
    expect(within(row).getByText("−40%")).toHaveClass("change-pill--bad");

    await user.click(row);
    await showChange(user);
    const headline = await screen.findByRole("group", { name: "Bonus, October vs April" });
    expect(headline).toHaveTextContent("−$200.00");
    expect(within(headline).getByText("−40.0%")).toHaveClass("change-pill--bad");
    expect(
      screen.getByText("Green where you earned more than in April, red where you earned less.")
    ).toBeInTheDocument();
  });

  it("gives screen readers each month's amount, since the chart itself is a picture", async () => {
    seed();
    await renderApp("/category-trends/expense/Eating%20out");

    // The chart is drawn for the eye only; a visually hidden table beside it
    // holds a header row, then one row per month of the 6M range (April to October).
    const table = await screen.findByRole("table", { name: "Monthly amounts" });
    const rows = within(table).getAllByRole("row").map((row) => row.textContent);
    expect(rows).toEqual([
      "MonthAmount",
      "April 2026$380.00",
      "May 2026$420.00",
      "June 2026$350.00",
      "July 2026$460.00",
      "August 2026$410.00",
      "September 2026$520.00",
      "October 2026$540.00",
    ]);
  });

  it("switches category from the picker and keeps the tab", async () => {
    seed();
    const { user } = await renderApp("/category-trends/expense/Eating%20out");

    await showChange(user);
    await user.click(await screen.findByRole("button", { name: "Expense category: Eating out. Change" }));
    const sheet = await screen.findByRole("dialog", { name: "Choose a category" });
    expect(within(sheet).getByRole("radio", { name: /Eating out/ })).toHaveAttribute("aria-checked", "true");
    await user.click(within(sheet).getByRole("radio", { name: /^Food/ }));

    expect(await screen.findByRole("group", { name: "Food, October vs April" })).toHaveTextContent("−$110.00");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains a category with nothing in the range and offers another", async () => {
    seed();
    const { user } = await renderApp("/category-trends/expense/Travel");

    expect(await screen.findByText("Nothing spent on Travel in this range")).toBeInTheDocument();
    expect(
      screen.getByText(
        "There are no expenses in this category between April and October. Pick a wider range or another category."
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Choose another category" }));
    expect(await screen.findByRole("dialog", { name: "Choose a category" })).toBeInTheDocument();
  });

  it("returns to the list on the category's type", async () => {
    seed();
    const { user } = await renderApp("/category-trends/income/Freelance");

    await user.click(await screen.findByRole("link", { name: "All categories" }));
    expect(await screen.findByRole("tab", { name: "Incomes" })).toHaveAttribute("aria-selected", "true");
    expect(listedNames()).toEqual(["Freelance", "Salary"]);
  });

  it.each(["Rent/Mortgage", "Café & bar", "50% off", "Q&A?#1"])(
    "opens a category named %s, whatever characters its name holds",
    async (name) => {
      seedEntries([
        { date: ts(2026, APRIL), amount: "100", type: "expense", categories_path: `,${name.toLowerCase()},` },
        { date: ts(2026, OCTOBER), amount: "120", type: "expense", categories_path: `,${name.toLowerCase()},` },
      ]);
      localStorage.setItem("categoryLists", JSON.stringify({ expense: [name], income: [] }));
      const { user } = await renderApp("/category-trends");

      await user.click(await screen.findByRole("link", { name: `${name}, $120.00, +20% vs April` }));
      expect(await screen.findByRole("group", { name: `${name}, Apr – Oct` })).toHaveTextContent("$220.00");
    }
  );

  it("sends a category that no longer exists back to the list", async () => {
    seed();
    await renderApp("/category-trends/expense/Holidays");

    expect(await screen.findByText("October vs April, biggest change first.")).toBeInTheDocument();
  });
});
