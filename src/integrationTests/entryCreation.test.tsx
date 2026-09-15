import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, FEBRUARY } from "./helpers/seed";
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

describe("entry creation", () => {
  it("user can create an expense and see it on the dashboard", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));

    await user.type(
      await screen.findByPlaceholderText(/insert expense amount/i),
      "75"
    );
    await user.type(screen.getByPlaceholderText(/description/i), "Test meal");
    await selectCategory(user, "Eating out");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Back on dashboard: expenses row shows the new amount
    expect(await screen.findByText("$75.00")).toBeInTheDocument();
  });

  it("user can create an income and see it on the dashboard", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add income/i }));

    await user.type(
      await screen.findByPlaceholderText(/insert income amount/i),
      "1000"
    );
    await user.type(screen.getByPlaceholderText(/description/i), "Monthly pay");
    await selectCategory(user, "Salary");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Back on dashboard: the Incomes row itself shows the new amount. (The
    // savings hero also reads $1,000.00 in this expense-less scenario, so a
    // bare findByText would be ambiguous; targeting the row keeps the
    // regression coverage on the incomes figure.)
    expect(
      await screen.findByRole("link", { name: /^Incomes \$1,000\.00$/ })
    ).toBeInTheDocument();
  });

  it("user can edit an entry immediately after creating it", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(await screen.findByPlaceholderText(/insert expense amount/i), "50");
    await user.type(screen.getByPlaceholderText(/description/i), "Groceries");
    await selectCategory(user, "Food");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Navigate to /expenses and click the newly created entry to edit it
    await user.click(await screen.findByText("Expenses"));
    await user.click(await screen.findByText(/groceries/i));

    const amountInput = await screen.findByPlaceholderText(/insert.*amount/i);
    await user.clear(amountInput);
    await user.type(amountInput, "75");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText("$75.00")).toBeInTheDocument();
    expect(screen.queryByText("$50.00")).not.toBeInTheDocument();
  });

  it("user can type to filter the category dropdown and pick the narrowed option", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(
      await screen.findByPlaceholderText(/insert expense amount/i),
      "42"
    );

    // Open the searchable dropdown; focus lands in its search box.
    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByLabelText(/search categories/i)).toHaveFocus();

    // Typing narrows the visible options down to the single match.
    await user.keyboard("eating");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Eating out");

    // Selecting the filtered option closes the panel and shows the choice.
    await user.click(options[0]);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Eating out");

    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(await screen.findByText("$42.00")).toBeInTheDocument();
  });

  it("shows an empty state when the category search matches nothing", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.click(await screen.findByRole("combobox"));
    await user.keyboard("definitely-not-a-category");

    expect(await screen.findByText(/no matching categories/i)).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    // Escape closes the panel without committing anything.
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("Select a category");
  });

  it("entry added while viewing a previous month is stored in that month and survives a page refresh", async () => {
    // Seed one entry in February so the app fills Feb–May and Prev is available
    seedEntries([
      { date: ts(2026, FEBRUARY), amount: "1", type: "income", categories_path: ",salary,", description: "Seed" },
    ]);

    const { user, unmount } = await renderApp("/");

    // Navigate from May → April → March → February
    await screen.findByText("May 2026");
    await user.click(await screen.findByRole("button", { name: /prev/i }));
    await screen.findByText("April 2026");
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("March 2026");
    await user.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("February 2026");

    // Add an expense while viewing February
    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(await screen.findByPlaceholderText(/insert expense amount/i), "99");
    await user.type(screen.getByPlaceholderText(/description/i), "Feb Rent");
    await selectCategory(user, "Food");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Before refresh: dashboard should be in February showing the new expense
    await screen.findByText("February 2026");
    expect(await screen.findByText("$99.00")).toBeInTheDocument();

    // Simulate page refresh: unmount and remount from scratch (localStorage persists)
    unmount();
    const { user: user2 } = await renderApp("/");

    // After refresh, app starts at the current month (May 2026)
    await screen.findByText("May 2026");

    // Navigate back to February
    await user2.click(await screen.findByRole("button", { name: /prev/i }));
    await screen.findByText("April 2026");
    await user2.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("March 2026");
    await user2.click(screen.getByRole("button", { name: /prev/i }));
    await screen.findByText("February 2026");

    // The expense must still be in February, not moved to May
    expect(await screen.findByText("$99.00")).toBeInTheDocument();
  });
});
