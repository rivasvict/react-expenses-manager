import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, APRIL, MAY } from "./helpers/seed";
import { selectCategory } from "./helpers/categorySelect";
import { goToPrevMonth } from "./helpers/navigation";

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

// Four May expenses with distinct descriptions, categories, amounts and days
// so search, sort and category behaviors are each observable on screen.
const seedMayExpenses = () =>
  seedEntries([
    { date: ts(2026, MAY, 20), amount: "12.5", type: "expense", categories_path: ",food,",         description: "Coffee beans" },
    { date: ts(2026, MAY, 10), amount: "30",   type: "expense", categories_path: ",eating out,",   description: "Morning latte" },
    { date: ts(2026, MAY, 5),  amount: "99",   type: "expense", categories_path: ",transportation,", description: "Bus pass" },
    { date: ts(2026, MAY, 1),  amount: "800",  type: "expense", categories_path: ",house (rent),", description: "Rent paid" },
  ]);

const ROW_TEXT = /coffee beans|morning latte|bus pass|rent paid/i;

// Rows render as "Category - Description" in document order, so this is the
// exact vertical order the user sees.
const getVisibleRowOrder = () =>
  screen.getAllByText(ROW_TEXT).map((row) => row.textContent);

const goToExpenses = async (user: Awaited<ReturnType<typeof renderApp>>["user"]) => {
  await user.click(await screen.findByText("Expenses"));
  await screen.findAllByText(ROW_TEXT);
};

const getSearchInput = () =>
  screen.findByRole("textbox", { name: "Search entries" });

const getSortButton = () => screen.getByRole("button", { name: "Sort entries" });

describe("/expenses - live search", () => {
  it("narrows rows to matching descriptions as the user types and restores them on clear", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    const searchInput = await getSearchInput();
    await user.type(searchInput, "cof");

    expect(await screen.findByText(/coffee beans/i)).toBeInTheDocument();
    expect(screen.queryByText(/morning latte/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bus pass/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rent paid/i)).not.toBeInTheDocument();

    await user.clear(searchInput);

    expect(await screen.findByText(/morning latte/i)).toBeInTheDocument();
    expect(screen.getByText(/coffee beans/i)).toBeInTheDocument();
    expect(screen.getByText(/bus pass/i)).toBeInTheDocument();
    expect(screen.getByText(/rent paid/i)).toBeInTheDocument();
  });

  it("matches category names too, case-insensitively", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.type(await getSearchInput(), "EATING");

    expect(await screen.findByText(/morning latte/i)).toBeInTheDocument();
    expect(screen.queryByText(/coffee beans/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bus pass/i)).not.toBeInTheDocument();
  });

  it("updates the total tile to the visible subset", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.type(await getSearchInput(), "coffee");

    // Only "Coffee beans" ($12.50) is left in the total.
    expect((await screen.findAllByText(/\$12\.50/)).length).toBeGreaterThan(0);
    expect(screen.queryByText(/\$941\.50/)).not.toBeInTheDocument();
  });
});

describe("/expenses - sort menu", () => {
  it("defaults to Date (newest first) and shows the current key on the button", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    expect(getSortButton()).toHaveTextContent("Sort: Date");
    expect(getVisibleRowOrder()).toEqual([
      "Food - Coffee beans",
      "Eating out - Morning latte",
      "Transportation - Bus pass",
      "House (rent) - Rent paid",
    ]);
  });

  it("reorders rows by highest amount and updates the button label", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.click(getSortButton());
    await user.click(
      await screen.findByRole("menuitemradio", { name: /amount — highest first/i })
    );

    expect(getSortButton()).toHaveTextContent("Sort: Amount");
    expect(getVisibleRowOrder()).toEqual([
      "House (rent) - Rent paid",
      "Transportation - Bus pass",
      "Eating out - Morning latte",
      "Food - Coffee beans",
    ]);
  });

  it("orders by category name then description for Name — A → Z", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.click(getSortButton());
    await user.click(
      await screen.findByRole("menuitemradio", { name: /name — a → z/i })
    );

    expect(getSortButton()).toHaveTextContent("Sort: Name");
    expect(getVisibleRowOrder()).toEqual([
      "Eating out - Morning latte",
      "Food - Coffee beans",
      "House (rent) - Rent paid",
      "Transportation - Bus pass",
    ]);
  });

  it("is keyboard operable: arrows move, Enter selects, menu closes", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.click(getSortButton());
    const menu = await screen.findByRole("menu");
    expect(menu).toBeInTheDocument();
    // Focus starts on the selected option (Date); one step down is Amount.
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(getSortButton()).toHaveTextContent("Sort: Amount");
    expect(getVisibleRowOrder()[0]).toBe("House (rent) - Rent paid");
  });

  it("closes on Escape without changing the sort", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.click(getSortButton());
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(getSortButton()).toHaveTextContent("Sort: Date");
  });

  it("marks only the current key as checked in the menu", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await user.click(getSortButton());

    expect(
      await screen.findByRole("menuitemradio", { name: /date — newest first/i })
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemradio", { name: /amount — highest first/i })
    ).toHaveAttribute("aria-checked", "false");
    expect(
      screen.getByRole("menuitemradio", { name: /name — a → z/i })
    ).toHaveAttribute("aria-checked", "false");
  });
});

describe("/expenses - category filter regression", () => {
  it("still filters by category, including regex-special names like House (Rent)", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await selectCategory(user, "House (Rent)");

    expect(await screen.findByText(/rent paid/i)).toBeInTheDocument();
    expect(screen.queryByText(/coffee beans/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/morning latte/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bus pass/i)).not.toBeInTheDocument();
  });

  it("combines the category filter with the search term", async () => {
    seedMayExpenses();
    const { user } = await renderApp("/");
    await goToExpenses(user);

    await selectCategory(user, "House (Rent)");
    await user.type(await getSearchInput(), "coffee");

    // "coffee" matches nothing within the House (Rent) category.
    expect(screen.queryByText(ROW_TEXT)).not.toBeInTheDocument();
  });
});

describe("filters & sort persistence", () => {
  it("survives month navigation done elsewhere in the app", async () => {
    seedEntries([
      { date: ts(2026, MAY, 10),   amount: "10",  type: "expense", categories_path: ",food,",         description: "May coffee" },
      { date: ts(2026, MAY, 1),    amount: "700", type: "expense", categories_path: ",house (rent),", description: "May rent" },
      { date: ts(2026, APRIL, 10), amount: "8",   type: "expense", categories_path: ",food,",         description: "April coffee" },
      { date: ts(2026, APRIL, 1),  amount: "700", type: "expense", categories_path: ",house (rent),", description: "April rent" },
    ]);
    const { user } = await renderApp("/");

    await user.click(await screen.findByText("Expenses"));
    await screen.findByText(/may coffee/i);

    await user.type(await getSearchInput(), "coffee");
    await user.click(getSortButton());
    await user.click(
      await screen.findByRole("menuitemradio", { name: /amount — highest first/i })
    );
    expect(await screen.findByText(/may coffee/i)).toBeInTheDocument();
    expect(screen.queryByText(/may rent/i)).not.toBeInTheDocument();

    // Leave the screen, change the month from the dashboard, come back.
    await user.click(screen.getByRole("button", { name: /go back/i }));
    await goToPrevMonth(user, "April 2026");
    await user.click(await screen.findByText("Expenses"));

    // Search term and sort key survived and now apply to April's entries.
    expect(await getSearchInput()).toHaveValue("coffee");
    expect(getSortButton()).toHaveTextContent("Sort: Amount");
    expect(await screen.findByText(/april coffee/i)).toBeInTheDocument();
    expect(screen.queryByText(/april rent/i)).not.toBeInTheDocument();
  });

  it("survives a reload (a fresh app render restores search, sort and rows)", async () => {
    seedMayExpenses();
    const { user: firstUser, unmount } = await renderApp("/");
    await goToExpenses(firstUser);

    await firstUser.type(await getSearchInput(), "coffee");
    await firstUser.click(getSortButton());
    await firstUser.click(
      await screen.findByRole("menuitemradio", { name: /amount — highest first/i })
    );
    expect(await screen.findByText(/coffee beans/i)).toBeInTheDocument();

    // "Reload": unmount everything and render the app from scratch on the
    // same localStorage.
    unmount();
    const { user } = await renderApp("/");
    await user.click(await screen.findByText("Expenses"));

    expect(await getSearchInput()).toHaveValue("coffee");
    expect(getSortButton()).toHaveTextContent("Sort: Amount");
    expect(await screen.findByText(/coffee beans/i)).toBeInTheDocument();
    expect(screen.queryByText(/morning latte/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rent paid/i)).not.toBeInTheDocument();
  });
});

describe("/incomes - toolbar behaves symmetrically", () => {
  const seedMayIncomes = () =>
    seedEntries([
      { date: ts(2026, MAY, 20), amount: "1000", type: "income", categories_path: ",salary,",  description: "Paycheck" },
      { date: ts(2026, MAY, 10), amount: "2500", type: "income", categories_path: ",deposit,", description: "Tax refund" },
      { date: ts(2026, MAY, 5),  amount: "50",   type: "income", categories_path: ",saving,",  description: "Piggy bank" },
    ]);

  it("live-searches incomes and updates the total", async () => {
    seedMayIncomes();
    const { user } = await renderApp("/");
    await user.click(await screen.findByText("Incomes"));
    await screen.findByText(/paycheck/i);

    await user.type(await getSearchInput(), "refund");

    expect(await screen.findByText(/tax refund/i)).toBeInTheDocument();
    expect(screen.queryByText(/paycheck/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/piggy bank/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/\$2,500\.00/).length).toBeGreaterThan(0);
  });

  it("sorts incomes by highest amount", async () => {
    seedMayIncomes();
    const { user } = await renderApp("/");
    await user.click(await screen.findByText("Incomes"));
    await screen.findByText(/paycheck/i);

    await user.click(getSortButton());
    await user.click(
      await screen.findByRole("menuitemradio", { name: /amount — highest first/i })
    );

    expect(
      screen.getAllByText(/paycheck|tax refund|piggy bank/i).map((row) => row.textContent)
    ).toEqual([
      "Deposit - Tax refund",
      "Salary - Paycheck",
      "Saving - Piggy bank",
    ]);
  });
});
