import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MAY } from "./helpers/seed";
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

// Two incomes + three expenses in May with distinct descriptions, categories,
// amounts and days so both-list narrowing, net polarity and sorting are each
// observable on screen.
const seedMayMonth = () =>
  seedEntries([
    { date: ts(2026, MAY, 20), amount: "1000", type: "income",  categories_path: ",salary,",         description: "Monthly paycheck" },
    { date: ts(2026, MAY, 6),  amount: "300",  type: "income",  categories_path: ",deposit,",        description: "Gift money" },
    { date: ts(2026, MAY, 10), amount: "12.5", type: "expense", categories_path: ",food,",           description: "Coffee beans" },
    { date: ts(2026, MAY, 2),  amount: "15",   type: "expense", categories_path: ",fun activities,", description: "Gift wrap" },
    { date: ts(2026, MAY, 1),  amount: "800",  type: "expense", categories_path: ",house (rent),",   description: "Rent paid" },
  ]);

const ROW_TEXT =
  /monthly paycheck|gift money|coffee beans|gift wrap|rent paid/i;

const getVisibleRowOrder = () =>
  screen.getAllByText(ROW_TEXT).map((row) => row.textContent);

type User = Awaited<ReturnType<typeof renderApp>>["user"];

// Navigating from "/" (instead of rendering /summary directly) mirrors the
// real user flow and the existing /summary suites.
const goToSummary = async (user: User) => {
  await user.click(await screen.findByTitle("Summary"));
  await screen.findAllByText(ROW_TEXT);
};

const getToolbarSearch = () =>
  screen.findByRole("textbox", { name: "Search entries" });

// The Show select is also a combobox on /summary, so the category picker is
// disambiguated by its accessible name instead of the shared helper.
const pickCategoryInSheet = async (user: User, categoryName: string) => {
  await user.click(
    await screen.findByRole("combobox", { name: "Filter by category" })
  );
  await user.click(await screen.findByRole("option", { name: categoryName }));
};

describe("/summary - one shared filter drives both lists", () => {
  it("narrows incomes AND expenses from a single search term", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    await user.type(await getToolbarSearch(), "gift");

    expect(await screen.findByText(/gift money/i)).toBeInTheDocument();
    expect(screen.getByText(/gift wrap/i)).toBeInTheDocument();
    expect(screen.queryByText(/monthly paycheck/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/coffee beans/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rent paid/i)).not.toBeInTheDocument();
  });

  it("applies the shared sort to both lists at once", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    // Default: each list date-descending, incomes first.
    expect(getVisibleRowOrder()).toEqual([
      "Salary - Monthly paycheck",
      "Deposit - Gift money",
      "Food - Coffee beans",
      "Fun activities - Gift wrap",
      "House (rent) - Rent paid",
    ]);

    await user.click(screen.getByRole("button", { name: "Sort entries" }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: /amount — highest first/i })
    );

    expect(getVisibleRowOrder()).toEqual([
      "Salary - Monthly paycheck",
      "Deposit - Gift money",
      "House (rent) - Rent paid",
      "Fun activities - Gift wrap",
      "Food - Coffee beans",
    ]);
  });

  it("supports income categories in the sheet's category picker", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    await openFilterSheet(user);
    await pickCategoryInSheet(user, "Deposit");
    await user.click(screen.getByRole("button", { name: "Show 1 result" }));

    expect(screen.getByText(/gift money/i)).toBeInTheDocument();
    expect(screen.queryByText(/monthly paycheck/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rent paid/i)).not.toBeInTheDocument();
    expect(screen.getByText("Category: Deposit")).toBeInTheDocument();
    expect(screen.getByText("1 of 5 entries")).toBeInTheDocument();
  });
});

describe("/summary - filtered banner with net total", () => {
  it('replaces the month tile with "Filtered view · both lists" and a signed positive net', async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    // Unfiltered: the month tile shows the plain total.
    expect(screen.getByText(/may total:/i)).toBeInTheDocument();

    // "gift" matches one income (300) and one expense (15): net +285.
    await user.type(await getToolbarSearch(), "gift");

    expect(
      await screen.findByText("Filtered view · both lists")
    ).toBeInTheDocument();
    expect(screen.queryByText(/may total:/i)).not.toBeInTheDocument();
    expect(screen.getByText("2 of 5 entries")).toBeInTheDocument();
    expect(screen.getByText("Filtered total · net")).toBeInTheDocument();
    expect(screen.getByText("+$285.00")).toBeInTheDocument();
    expect(screen.getByText('"gift"')).toBeInTheDocument();
  });

  it("shows a negative net in the rose tone when filtered expenses outweigh incomes", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    // "coffee" matches only the $12.50 expense: net -12.50. The same text
    // also appears as the Matching-expenses per-list total, so the banner
    // value is picked out of the matches by its class.
    await user.type(await getToolbarSearch(), "coffee");

    expect((await screen.findAllByText("-$12.50")).length).toBeGreaterThan(0);
    expect(screen.getByText("1 of 5 entries")).toBeInTheDocument();
    // Tone comes from the sign: rose for negative, green for positive.
    const negativeNet = screen
      .getAllByText("-$12.50")
      .find((element) =>
        element.classList.contains("filtered-banner__total-value")
      );
    expect(negativeNet).toHaveClass("filtered-banner__total-value--expense");

    await user.clear(await getToolbarSearch());
    await user.type(await getToolbarSearch(), "gift");
    expect(await screen.findByText("+$285.00")).toHaveClass(
      "filtered-banner__total-value--income"
    );
  });

  it("shows per-list Matching headers with per-list totals while filtered", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    await user.type(await getToolbarSearch(), "gift");

    expect(await screen.findByText("Matching incomes")).toBeInTheDocument();
    expect(screen.getByText("Matching expenses")).toBeInTheDocument();
    // Per-list totals live inside each header ($300.00 also shows as the row
    // amount, so the assertions are scoped to the headers' total slot).
    expect(
      screen.getByText("$300.00", { selector: ".list-section-header__count" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("-$15.00", { selector: ".list-section-header__count" })
    ).toBeInTheDocument();
  });

  it("drops a single chip and Clear restores the month tile and default sort", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    await user.click(screen.getByRole("button", { name: "Sort entries" }));
    await user.click(
      await screen.findByRole("menuitemradio", { name: /amount — highest first/i })
    );
    await user.type(await getToolbarSearch(), "gift");

    // Dropping the search chip empties the search but keeps the sort.
    await user.click(
      screen.getByRole("button", { name: 'Remove filter "gift"' })
    );
    expect(await getToolbarSearch()).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Sort entries" })
    ).toHaveTextContent("Sort: Amount");

    // Clear from the banner resets everything, including the sort.
    await user.type(await getToolbarSearch(), "gift");
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(await screen.findByText(/may total:/i)).toBeInTheDocument();
    expect(
      screen.queryByText("Filtered view · both lists")
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sort entries" })
    ).toHaveTextContent("Sort: Date");
    expect(getVisibleRowOrder()[0]).toBe("Salary - Monthly paycheck");
  });
});

describe("/summary - cross-screen filter carryover", () => {
  it("a filter set on /expenses is already active on /summary", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");

    await user.click(await screen.findByText("Expenses"));
    await screen.findByText(/coffee beans/i);
    await user.type(await getToolbarSearch(), "coffee");
    expect(await screen.findByText("Filtered view")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /go back/i }));
    await goToSummary(user);

    expect(
      await screen.findByText("Filtered view · both lists")
    ).toBeInTheDocument();
    expect(screen.getByText('"coffee"')).toBeInTheDocument();
    expect(screen.getByText(/coffee beans/i)).toBeInTheDocument();
    expect(screen.queryByText(/monthly paycheck/i)).not.toBeInTheDocument();
  });
});

describe('/summary - "Show" select regression and interplay', () => {
  it("still switches between All/Incomes/Expenses when no filters are active", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Show" }),
      "Incomes"
    );
    expect(await screen.findByText(/monthly paycheck/i)).toBeInTheDocument();
    expect(screen.queryByText(/rent paid/i)).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Show" }),
      "Expenses"
    );
    expect(await screen.findByText(/rent paid/i)).toBeInTheDocument();
    expect(screen.queryByText(/monthly paycheck/i)).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Show" }),
      "All incomes and expenses"
    );
    expect(await screen.findByText(/monthly paycheck/i)).toBeInTheDocument();
    expect(screen.getByText(/rent paid/i)).toBeInTheDocument();
  });

  it("filters apply within whatever the Show select displays", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    await user.type(await getToolbarSearch(), "gift");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Show" }),
      "Expenses"
    );

    // Only the matching expense is listed, but the banner still reports both
    // lists (one filter state drives everything).
    expect(await screen.findByText(/gift wrap/i)).toBeInTheDocument();
    expect(screen.queryByText(/gift money/i)).not.toBeInTheDocument();
    expect(screen.getByText("2 of 5 entries")).toBeInTheDocument();
    expect(screen.getByText("+$285.00")).toBeInTheDocument();
  });
});

describe("/summary - empty state", () => {
  it("shows the dashed card and $0.00 net when nothing matches across both lists", async () => {
    seedMayMonth();
    const { user } = await renderApp("/");
    await goToSummary(user);

    await user.type(await getToolbarSearch(), "zzz nothing");

    expect(
      await screen.findByText("No entries match your filters")
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 5 entries")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.queryByText(ROW_TEXT)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear all filters" }));

    expect((await screen.findAllByText(ROW_TEXT)).length).toBe(5);
    expect(screen.getByText(/may total:/i)).toBeInTheDocument();
  });
});
