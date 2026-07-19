import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MARCH, APRIL, MAY } from "./helpers/seed";
import { selectCategory } from "./helpers/categorySelect";

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("dashboard algebraic sum", () => {
  it("shows correct savings total from seeded incomes and expenses", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "1000", type: "income", categories_path: ",salary," },
      { date: ts(2026, MAY), amount: "500",  type: "income", categories_path: ",deposit," },
      { date: ts(2026, MAY), amount: "200",  type: "expense", categories_path: ",food," },
      { date: ts(2026, MAY), amount: "100",  type: "expense", categories_path: ",eating out," },
    ]);

    await renderApp("/");

    // Incomes: $1,500 | Expenses: $300 | Savings: $1,200
    // Incomes and expenses are in dedicated table cells; exact match works.
    expect(await screen.findByText("$1,500.00")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    // Savings is rendered inside a ContentTileSection with an icon splitting the text node,
    // so we use a flexible matcher.
    expect(screen.getAllByText(/\$1,200\.00/).length).toBeGreaterThan(0);
  });
});

describe("edit / delete", () => {
  it("reflects updated amount after editing an expense", async () => {
    const [seeded] = seedEntries([
      { date: ts(2026, MAY), amount: "50", type: "expense", categories_path: ",food,", description: "Groceries" },
    ]);

    const { user } = await renderApp("/");

    // Navigate to /expenses
    await user.click(await screen.findByText("Expenses"));

    // Click the entry to navigate to the edit form
    await user.click(await screen.findByText(/groceries/i));

    // Wait for the edit form to load the entry
    const amountInput = await screen.findByPlaceholderText(/insert.*amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, "90");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Back on /expenses: updated amount appears
    expect(await screen.findByText("$90.00")).toBeInTheDocument();
    expect(screen.queryByText("$50.00")).not.toBeInTheDocument();
  });

  it("removes entry after clicking REMOVE ENTRY", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "50", type: "expense", categories_path: ",food,", description: "Groceries" },
    ]);

    const { user } = await renderApp("/");

    // Navigate to /expenses
    await user.click(await screen.findByText("Expenses"));

    // Click the entry to navigate to the edit form
    await user.click(await screen.findByText(/groceries/i));

    // Delete the entry
    await user.click(await screen.findByRole("button", { name: /remove entry/i }));

    // After deletion the entry is gone from the expenses list
    expect(screen.queryByText(/groceries/i)).not.toBeInTheDocument();
  });
});

describe("/incomes route", () => {
  it("shows seeded incomes with correct total", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "800",  type: "income", categories_path: ",salary,",  description: "Paycheck" },
      { date: ts(2026, MAY), amount: "200",  type: "income", categories_path: ",deposit,", description: "Transfer" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByText("Incomes"));

    // Both entries appear
    expect(await screen.findByText(/paycheck/i)).toBeInTheDocument();
    expect(screen.getByText(/transfer/i)).toBeInTheDocument();
    // Combined total: $1,000 — the total text is split by an icon so we use a flexible matcher
    expect(screen.getAllByText(/\$1,000\.00/).length).toBeGreaterThan(0);
  });

  it("filters incomes by category", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "800", type: "income", categories_path: ",salary,",  description: "Paycheck" },
      { date: ts(2026, MAY), amount: "200", type: "income", categories_path: ",deposit,", description: "Transfer" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByText("Incomes"));

    // Select "Salary" filter
    await selectCategory(user, "Salary");

    // Only the salary entry is shown
    expect(await screen.findByText(/paycheck/i)).toBeInTheDocument();
    expect(screen.queryByText(/transfer/i)).not.toBeInTheDocument();
  });
});

describe("/expenses route", () => {
  it("shows seeded expenses with correct total", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "120", type: "expense", categories_path: ",food,",       description: "Supermarket" },
      { date: ts(2026, MAY), amount: "30",  type: "expense", categories_path: ",eating out,", description: "Lunch" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByText("Expenses"));

    // Both entries appear
    expect(await screen.findByText(/supermarket/i)).toBeInTheDocument();
    expect(screen.getByText(/lunch/i)).toBeInTheDocument();
    // Combined total: $150 — text is split by an icon
    expect(screen.getAllByText(/\$150\.00/).length).toBeGreaterThan(0);
  });

  it("filters expenses by category", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "120", type: "expense", categories_path: ",food,",       description: "Supermarket" },
      { date: ts(2026, MAY), amount: "30",  type: "expense", categories_path: ",eating out,", description: "Lunch" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByText("Expenses"));

    // Select "Food" filter
    await selectCategory(user, "Food");

    // Only the food entry is shown
    expect(await screen.findByText(/supermarket/i)).toBeInTheDocument();
    expect(screen.queryByText(/lunch/i)).not.toBeInTheDocument();
  });
});

describe("/incomes route - past months", () => {
  it("shows correct incomes when navigating one month back (April)", async () => {
    seedEntries([
      { date: ts(2026, MARCH), amount: "600", type: "income",  categories_path: ",salary,", description: "March Pay" },
      { date: ts(2026, MARCH), amount: "55",  type: "expense", categories_path: ",food,",   description: "March Groceries" },
      { date: ts(2026, APRIL), amount: "700", type: "income",  categories_path: ",salary,", description: "April Pay" },
      { date: ts(2026, APRIL), amount: "65",  type: "expense", categories_path: ",food,",   description: "April Groceries" },
      { date: ts(2026, MAY),   amount: "800", type: "income",  categories_path: ",salary,", description: "May Pay" },
      { date: ts(2026, MAY),   amount: "75",  type: "expense", categories_path: ",food,",   description: "May Groceries" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: /prev/i }));
    await screen.findByText("April 2026");

    await user.click(await screen.findByText("Incomes"));

    expect(await screen.findByText(/april pay/i)).toBeInTheDocument();
    expect(screen.queryByText(/march pay/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/may pay/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/april groceries/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\$700\.00/).length).toBeGreaterThan(0);
  });

  it("shows correct incomes when navigating two months back (March)", async () => {
    seedEntries([
      { date: ts(2026, MARCH), amount: "600", type: "income",  categories_path: ",salary,", description: "March Pay" },
      { date: ts(2026, MARCH), amount: "55",  type: "expense", categories_path: ",food,",   description: "March Groceries" },
      { date: ts(2026, APRIL), amount: "700", type: "income",  categories_path: ",salary,", description: "April Pay" },
      { date: ts(2026, APRIL), amount: "65",  type: "expense", categories_path: ",food,",   description: "April Groceries" },
      { date: ts(2026, MAY),   amount: "800", type: "income",  categories_path: ",salary,", description: "May Pay" },
      { date: ts(2026, MAY),   amount: "75",  type: "expense", categories_path: ",food,",   description: "May Groceries" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: /prev/i }));
    await screen.findByText("April 2026");
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("March 2026");

    await user.click(await screen.findByText("Incomes"));

    expect(await screen.findByText(/march pay/i)).toBeInTheDocument();
    expect(screen.queryByText(/april pay/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/may pay/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/march groceries/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\$600\.00/).length).toBeGreaterThan(0);
  });
});

describe("/expenses route - past months", () => {
  it("shows correct expenses when navigating one month back (April)", async () => {
    seedEntries([
      { date: ts(2026, MARCH), amount: "600", type: "income",  categories_path: ",salary,", description: "March Pay" },
      { date: ts(2026, MARCH), amount: "80",  type: "expense", categories_path: ",food,",   description: "March Groceries" },
      { date: ts(2026, APRIL), amount: "700", type: "income",  categories_path: ",salary,", description: "April Pay" },
      { date: ts(2026, APRIL), amount: "90",  type: "expense", categories_path: ",food,",   description: "April Groceries" },
      { date: ts(2026, MAY),   amount: "800", type: "income",  categories_path: ",salary,", description: "May Pay" },
      { date: ts(2026, MAY),   amount: "100", type: "expense", categories_path: ",food,",   description: "May Groceries" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: /prev/i }));
    await screen.findByText("April 2026");

    await user.click(await screen.findByText("Expenses"));

    expect(await screen.findByText(/april groceries/i)).toBeInTheDocument();
    expect(screen.queryByText(/march groceries/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/may groceries/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/april pay/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\$90\.00/).length).toBeGreaterThan(0);
  });

  it("shows correct expenses when navigating two months back (March)", async () => {
    seedEntries([
      { date: ts(2026, MARCH), amount: "600", type: "income",  categories_path: ",salary,", description: "March Pay" },
      { date: ts(2026, MARCH), amount: "80",  type: "expense", categories_path: ",food,",   description: "March Groceries" },
      { date: ts(2026, APRIL), amount: "700", type: "income",  categories_path: ",salary,", description: "April Pay" },
      { date: ts(2026, APRIL), amount: "90",  type: "expense", categories_path: ",food,",   description: "April Groceries" },
      { date: ts(2026, MAY),   amount: "800", type: "income",  categories_path: ",salary,", description: "May Pay" },
      { date: ts(2026, MAY),   amount: "100", type: "expense", categories_path: ",food,",   description: "May Groceries" },
    ]);

    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("button", { name: /prev/i }));
    await screen.findByText("April 2026");
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("March 2026");

    await user.click(await screen.findByText("Expenses"));

    expect(await screen.findByText(/march groceries/i)).toBeInTheDocument();
    expect(screen.queryByText(/april groceries/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/may groceries/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/march pay/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\$80\.00/).length).toBeGreaterThan(0);
  });
});

describe("/summary route", () => {
  // The Summary component stores selectedEntries in constructor state from props.entries at mount time.
  // If entries are not yet in Redux when Summary mounts, the constructor sees empty entries and
  // the entry list never re-renders (no componentDidUpdate). Navigating from "/" ensures entries
  // are already in Redux when Summary mounts.
  async function goToSummary(user: ReturnType<typeof import("@testing-library/user-event").default.setup>) {
    // Click the "Summary" section link on the dashboard (title="Summary" link)
    const summaryLink = await screen.findByTitle("Summary");
    await user.click(summaryLink);
  }

  it("shows all entries with combined total by default", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "1000", type: "income",  categories_path: ",salary,",     description: "Pay" },
      { date: ts(2026, MAY), amount: "200",  type: "expense", categories_path: ",eating out,", description: "Dinner" },
    ]);

    const { user } = await renderApp("/");
    await goToSummary(user);

    expect(await screen.findByText(/pay/i)).toBeInTheDocument();
    expect(screen.getByText(/dinner/i)).toBeInTheDocument();
    // Both section headers appear (always rendered by EntriesSummary even when empty)
    expect(screen.getAllByText("Incomes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Expenses").length).toBeGreaterThan(0);
  });

  it("filters to show only incomes when Incomes is selected", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "1000", type: "income",  categories_path: ",salary,",     description: "Pay" },
      { date: ts(2026, MAY), amount: "200",  type: "expense", categories_path: ",eating out,", description: "Dinner" },
    ]);

    const { user } = await renderApp("/");
    await goToSummary(user);

    await screen.findByText(/pay/i); // wait for entries to appear

    await user.selectOptions(screen.getByRole("combobox"), "Incomes");

    expect(await screen.findByText(/pay/i)).toBeInTheDocument();
    expect(screen.queryByText(/dinner/i)).not.toBeInTheDocument();
    // Incomes total shown in header
    expect(screen.getAllByText(/\$1,000\.00/).length).toBeGreaterThan(0);
  });

  it("filters to show only expenses when Expenses is selected", async () => {
    seedEntries([
      { date: ts(2026, MAY), amount: "1000", type: "income",  categories_path: ",salary,",     description: "Pay" },
      { date: ts(2026, MAY), amount: "200",  type: "expense", categories_path: ",eating out,", description: "Dinner" },
    ]);

    const { user } = await renderApp("/");
    await goToSummary(user);

    await screen.findByText(/pay/i); // wait for entries to appear

    await user.selectOptions(screen.getByRole("combobox"), "Expenses");

    expect(await screen.findByText(/dinner/i)).toBeInTheDocument();
    expect(screen.queryByText(/pay/i)).not.toBeInTheDocument();
    // Expenses total shown in header
    expect(screen.getAllByText(/\$200\.00/).length).toBeGreaterThan(0);
  });
});
