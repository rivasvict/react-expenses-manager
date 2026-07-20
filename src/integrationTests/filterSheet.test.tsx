import { screen, within } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY } from "./helpers/seed";
import { selectCategory } from "./helpers/categorySelect";
import { openFilterSheet } from "./helpers/filters";

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

const seedMayExpenses = () =>
  seedEntries([
    { date: ts(2026, MAY, 20), amount: "12.5", type: "expense", categories_path: ",food,",         description: "Coffee beans" },
    { date: ts(2026, MAY, 10), amount: "30",   type: "expense", categories_path: ",eating out,",   description: "Morning latte" },
    { date: ts(2026, MAY, 5),  amount: "99",   type: "expense", categories_path: ",transportation,", description: "Bus pass" },
    { date: ts(2026, MAY, 1),  amount: "800",  type: "expense", categories_path: ",house (rent),", description: "Rent paid" },
  ]);

const ROW_TEXT = /coffee beans|morning latte|bus pass|rent paid/i;

const getVisibleRowOrder = () =>
  screen.getAllByText(ROW_TEXT).map((row) => row.textContent);

const goToExpenses = async (user: Awaited<ReturnType<typeof renderApp>>["user"]) => {
  await user.click(await screen.findByText("Expenses"));
  await screen.findAllByText(ROW_TEXT);
};

const getToolbarSearch = () =>
  screen.findByRole("textbox", { name: "Search entries" });

const getFiltersButton = () =>
  screen.getByRole("button", { name: /open filters/i });

describe("filter sheet - opening and shared state", () => {
  it("opens from the Filters button, moves focus to its heading, and closes on Escape returning focus", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await openFilterSheet(user);

    const heading = screen.getByRole("heading", { name: /filters & sort/i });
    expect(heading).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("heading", { name: /filters & sort/i })
    ).not.toBeInTheDocument();
    expect(getFiltersButton()).toHaveFocus();
  });

  it("mirrors the toolbar search and shows the live result count on the primary button", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.type(await getToolbarSearch(), "cof");
    await openFilterSheet(user);

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("cof");
    expect(
      screen.getByRole("button", { name: "Show 1 result" })
    ).toBeInTheDocument();

    // Clearing the sheet search restores every row and the count pluralizes.
    await user.clear(screen.getByRole("textbox", { name: "Search" }));
    expect(
      await screen.findByRole("button", { name: "Show 4 results" })
    ).toBeInTheDocument();
  });

  it("picks a category inside the sheet, live-narrows the list, and the primary button dismisses", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await openFilterSheet(user);
    await selectCategory(user, "Eating out");

    // Live: the list behind the sheet narrowed already.
    expect(await screen.findByText(/morning latte/i)).toBeInTheDocument();
    expect(screen.queryByText(/coffee beans/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show 1 result" }));

    expect(
      screen.queryByRole("heading", { name: /filters & sort/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/morning latte/i)).toBeInTheDocument();
  });

  it("changes the shared sort from the sheet (toolbar label follows)", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await openFilterSheet(user);
    await user.click(screen.getByRole("radio", { name: /amount — highest first/i }));
    await user.click(screen.getByRole("button", { name: "Show 4 results" }));

    expect(
      screen.getByRole("button", { name: "Sort entries" })
    ).toHaveTextContent("Sort: Amount");
    expect(getVisibleRowOrder()[0]).toBe("House (rent) - Rent paid");
  });

  it("clears every filter with Clear all (sheet stays open, count restored)", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.type(await getToolbarSearch(), "cof");
    await openFilterSheet(user);
    await selectCategory(user, "Food");

    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(
      await screen.findByRole("button", { name: "Show 4 results" })
    ).toBeInTheDocument();
    expect(await getToolbarSearch()).toHaveValue("");
    expect(screen.getByText(/rent paid/i)).toBeInTheDocument();
  });
});

describe("filter sheet - search scope toggle", () => {
  it('defaults to "All text" (category names match) and shows the hint', async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.type(await getToolbarSearch(), "eating");
    expect(await screen.findByText(/morning latte/i)).toBeInTheDocument();

    await openFilterSheet(user);
    expect(screen.getByRole("radio", { name: "All text" })).toBeChecked();
    expect(
      screen.getByText(
        /"All text" matches category \+ description\. Switch to "Description only" to scope the search to what you typed on the entry\./
      )
    ).toBeInTheDocument();
  });

  it('"Description only" stops category-name matches from counting', async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    // "eating" only exists as a category name, never in a description.
    await user.type(await getToolbarSearch(), "eating");
    expect(await screen.findByText(/morning latte/i)).toBeInTheDocument();

    await openFilterSheet(user);
    await user.click(screen.getByRole("radio", { name: "Description only" }));

    expect(
      await screen.findByRole("button", { name: "Show 0 results" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/morning latte/i)).not.toBeInTheDocument();
  });
});

describe("filtered banner", () => {
  it("replaces the total tile and shows count, chips and the filtered total", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    expect(screen.getByText(/expenses total:/i)).toBeInTheDocument();

    await user.type(await getToolbarSearch(), "coffee");

    expect(await screen.findByText("Filtered view")).toBeInTheDocument();
    expect(screen.queryByText(/expenses total:/i)).not.toBeInTheDocument();
    expect(screen.getByText("1 of 4 entries")).toBeInTheDocument();
    expect(screen.getByText('"coffee"')).toBeInTheDocument();
    expect(screen.getByText("Filtered total")).toBeInTheDocument();
    expect(screen.getAllByText(/\$12\.50/).length).toBeGreaterThan(0);
  });

  it("shows one chip per active filter and dropping a chip removes only that filter", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.type(await getToolbarSearch(), "latte");
    await openFilterSheet(user);
    await selectCategory(user, "Eating out");
    await user.click(screen.getByRole("button", { name: "Show 1 result" }));

    expect(screen.getByText('"latte"')).toBeInTheDocument();
    expect(screen.getByText("Category: Eating out")).toBeInTheDocument();

    // Drop only the search chip: the category filter must survive.
    await user.click(
      screen.getByRole("button", { name: 'Remove filter "latte"' })
    );

    expect(screen.queryByText('"latte"')).not.toBeInTheDocument();
    expect(screen.getByText("Category: Eating out")).toBeInTheDocument();
    expect(await getToolbarSearch()).toHaveValue("");
    expect(screen.getByText(/morning latte/i)).toBeInTheDocument();
    expect(screen.queryByText(/coffee beans/i)).not.toBeInTheDocument();
  });

  it("Clear removes every filter AND resets the sort to Date, restoring the tile", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    // Non-default sort + a filter.
    await user.click(screen.getByRole("button", { name: "Sort entries" }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: /amount — highest first/i })
    );
    await user.type(await getToolbarSearch(), "coffee");
    expect(await screen.findByText("Filtered view")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("Filtered view")).not.toBeInTheDocument();
    expect(await screen.findByText(/expenses total:/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sort entries" })
    ).toHaveTextContent("Sort: Date");
    // Order is back to date, newest first.
    expect(getVisibleRowOrder()).toEqual([
      "Food - Coffee beans",
      "Eating out - Morning latte",
      "Transportation - Bus pass",
      "House (rent) - Rent paid",
    ]);
  });
});

describe("filters button badge", () => {
  it("counts active non-search filters and hides when there are none", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    // No badge by default.
    expect(within(getFiltersButton()).queryByText("1")).not.toBeInTheDocument();

    // Search alone never counts toward the badge.
    await user.type(await getToolbarSearch(), "coffee");
    expect(within(getFiltersButton()).queryByText("1")).not.toBeInTheDocument();

    // Category counts.
    await openFilterSheet(user);
    await selectCategory(user, "Food");
    expect(within(getFiltersButton()).getByText("1")).toBeInTheDocument();

    // Scope counts too.
    await user.click(screen.getByRole("radio", { name: "Description only" }));
    expect(within(getFiltersButton()).getByText("2")).toBeInTheDocument();
  });
});

describe("list section header", () => {
  it('shows "Expenses" with the entry count by default and "Matching expenses" while filtered', async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("4 entries")).toBeInTheDocument();

    await user.type(await getToolbarSearch(), "coffee");

    expect(await screen.findByText("Matching expenses")).toBeInTheDocument();
    expect(screen.getByText("1 entry")).toBeInTheDocument();
    expect(screen.queryByText("4 entries")).not.toBeInTheDocument();
  });
});

describe("empty state", () => {
  it("keeps the banner ($0.00, 0 of M) and shows the dashed card with a working clear button", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.type(await getToolbarSearch(), "zzz nothing matches");

    expect(
      await screen.findByText("No entries match your filters")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Try a different search term or a broader category.")
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 4 entries")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear all filters" }));

    expect(
      screen.queryByText("No entries match your filters")
    ).not.toBeInTheDocument();
    expect((await screen.findAllByText(ROW_TEXT)).length).toBe(4);
    expect(screen.getByText(/expenses total:/i)).toBeInTheDocument();
  });
});

describe("/incomes - sheet behaves symmetrically", () => {
  it("filters incomes from the sheet and shows the income-toned banner total", async () => {
    seedEntries([
      { date: ts(2026, MAY, 20), amount: "1000", type: "income", categories_path: ",salary,",  description: "Paycheck" },
      { date: ts(2026, MAY, 10), amount: "2500", type: "income", categories_path: ",deposit,", description: "Tax refund" },
    ]);
    const { user } = await renderApp("/");
    await user.click(await screen.findByText("Incomes"));
    await screen.findByText(/paycheck/i);

    await openFilterSheet(user);
    await selectCategory(user, "Deposit");
    await user.click(screen.getByRole("button", { name: "Show 1 result" }));

    expect(screen.getByText("Filtered view")).toBeInTheDocument();
    expect(screen.getByText("Category: Deposit")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 entries")).toBeInTheDocument();
    expect(screen.getByText("Matching incomes")).toBeInTheDocument();
    expect(screen.getAllByText(/\$2,500\.00/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/paycheck/i)).not.toBeInTheDocument();
  });
});
