import { screen, within } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, SEPTEMBER, OCTOBER } from "./helpers/seed";
import { selectCategory } from "./helpers/categorySelect";
import { goToPrevMonth } from "./helpers/navigation";

/**
 * Category management (design/features/category-management/ui/decision.md):
 * the tabbed list, adding, renaming and deleting income and expense
 * categories, moving the entries and buckets that use them, and the
 * one-time migration of installs that predate `categoryLists`. Seeded like
 * the design's fixtures (design/features/category-management/ui/fixtures.json).
 */

const PINNED_DATE = new Date("2026-10-15T12:00:00");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

const expense = (description: string, amount: string, category: string, day: number, month = OCTOBER) => ({
  description,
  amount,
  type: "expense" as const,
  categories_path: `,${category},`,
  date: ts(2026, month, day),
});

const income = (description: string, amount: string, category: string, day: number, month = OCTOBER) => ({
  ...expense(description, amount, category, day, month),
  type: "income" as const,
});

const seedFixture = ({
  incomeCategories = ["Salary", "Deposit"],
}: { incomeCategories?: string[] } = {}) => {
  localStorage.setItem(
    "categoryLists",
    JSON.stringify({
      expense: ["Eating out", "Food", "Subscriptions", "Transportation", "Travel"],
      income: incomeCategories,
    })
  );
  localStorage.setItem(
    "buckets",
    JSON.stringify({
      "Eating out": [{ from: "0000-00", limit: 400 }],
      Food: [{ from: "0000-00", limit: 650 }],
    })
  );
  seedEntries([
    expense("Sushi with Ana", "64.50", "eating out", 12),
    expense("Pizza night", "38.00", "eating out", 4),
    expense("Coffee & bagel", "9.75", "eating out", 28, SEPTEMBER),
    expense("Birthday dinner", "142.30", "eating out", 20, SEPTEMBER),
    expense("Tacos", "21.40", "eating out", 9, SEPTEMBER),
    expense("Groceries", "120.40", "food", 10),
    expense("Farmers market", "36.00", "food", 3),
    expense("Weekly shop", "98.15", "food", 26, SEPTEMBER),
    expense("Bus pass", "97.00", "transportation", 1),
    expense("Taxi", "18.50", "transportation", 15, SEPTEMBER),
    expense("Music streaming", "10.99", "subscriptions", 5),
    income("October pay", "4000", "salary", 1),
    income("September pay", "4000", "salary", 1, SEPTEMBER),
  ]);
};

const row = (name: string | RegExp) =>
  screen.findByRole("button", { name: typeof name === "string" ? new RegExp(`^${name}`) : name });

const openCategory = async (user: UserEvent, name: string) => {
  await user.click(await row(name));
  return screen.findByRole("dialog", { name: new RegExp(`category ${name}$`) });
};

describe("the categories list", () => {
  it("shows one type at a time under tabs with counts, each row with its usage and bucket", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    expect(await screen.findByRole("tab", { name: "Expenses 5" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(await row("Eating out")).toHaveTextContent(
      "Eating out5 expenses · Bucket $400.00/mo"
    );
    expect(await row("Food")).toHaveTextContent("Food3 expenses · Bucket $650.00/mo");
    expect(await row("Subscriptions")).toHaveTextContent("Subscriptions1 expense");
    expect(await row("Travel")).toHaveTextContent("TravelNot used yet");

    await user.click(screen.getByRole("tab", { name: "Incomes 2" }));
    expect(await row("Salary")).toHaveTextContent("Salary2 incomes");
    expect(await row("Deposit")).toHaveTextContent("DepositNot used yet");
    expect(screen.queryByRole("button", { name: /^Eating out/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add income category" })).toBeInTheDocument();
  });

  it("shows an illustrated empty state with a create action when a type has none", async () => {
    seedFixture({ incomeCategories: [] });
    const { user } = await renderApp("/categories");

    await user.click(await screen.findByRole("tab", { name: "Incomes 0" }));

    expect(
      await screen.findByRole("heading", { name: "No income categories yet" })
    ).toBeInTheDocument();
    expect(screen.getByText(/so you can see where your money comes from/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add income category" }));
    expect(
      await screen.findByRole("dialog", { name: "New income category" })
    ).toBeInTheDocument();
  });
});

describe("adding a category", () => {
  it("refuses a duplicate in the same type but allows the same name in the other type", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    await user.click(await screen.findByRole("button", { name: "Add expense category" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "FOOD");
    await user.click(screen.getByRole("button", { name: "Create category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An expense category called “FOOD” already exists."
    );
    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(screen.getByRole("tab", { name: /Incomes/ }));
    await user.click(screen.getByRole("button", { name: "Add income category" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Food");
    await user.click(screen.getByRole("button", { name: "Create category" }));

    expect(await row("Food")).toHaveTextContent("FoodNot used yet");
    expect(screen.getByRole("tab", { name: "Incomes 3" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Expenses 5" })).toBeInTheDocument();
  });
});

describe("renaming a category", () => {
  it("moves its entries and its bucket to the new name", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    const sheet = await openCategory(user, "Eating out");
    expect(
      within(sheet).getByText(/to the new name/)
    ).toHaveTextContent(
      "Saving changes 5 existing expenses and the $400.00 bucket from “Eating out” to the new name. Synced devices get the change too."
    );
    const name = within(sheet).getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Restaurants");
    await user.click(within(sheet).getByRole("button", { name: "Save changes" }));

    expect(await row("Restaurants")).toHaveTextContent(
      "Restaurants5 expenses · Bucket $400.00/mo"
    );
    expect(screen.queryByRole("button", { name: /^Eating out/ })).not.toBeInTheDocument();

    // The bucket kept its limit under the new name.
    await user.click(screen.getByRole("link", { name: "Buckets" }));
    expect(await screen.findByText("Restaurants")).toBeInTheDocument();
    expect(screen.queryByText("Eating out")).not.toBeInTheDocument();

    // The entries are filed under the new name.
    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByText("Expenses"));
    expect((await screen.findAllByText("Restaurants")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Eating out")).not.toBeInTheDocument();
  });

  it("refuses a name another category of the type already has", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    const sheet = await openCategory(user, "Eating out");
    const name = within(sheet).getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Food");
    await user.click(within(sheet).getByRole("button", { name: "Save changes" }));

    expect(within(sheet).getByRole("alert")).toHaveTextContent(
      "An expense category called “Food” already exists."
    );
  });
});

describe("deleting a category", () => {
  it("deletes an unused category after a plain confirmation", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    const sheet = await openCategory(user, "Travel");
    expect(within(sheet).getByText("No entries use this category.")).toBeInTheDocument();
    await user.click(within(sheet).getByRole("button", { name: "Delete category" }));

    const confirm = await screen.findByRole("alertdialog", { name: "Delete “Travel”?" });
    expect(confirm).toHaveTextContent("No entries use this category, so nothing else changes.");
    await user.click(within(confirm).getByRole("button", { name: "Delete category" }));

    expect(await screen.findByRole("tab", { name: "Expenses 4" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Travel/ })).not.toBeInTheDocument();
  });

  it("moves every entry to one category with Apply to all, and removes the bucket", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    const sheet = await openCategory(user, "Eating out");
    await user.click(within(sheet).getByRole("button", { name: "Delete category" }));
    const deleteSheet = await screen.findByRole("alertdialog", {
      name: "Delete “Eating out”?",
    });

    expect(within(deleteSheet).getByRole("status")).toHaveTextContent(
      "5 expenses still need a category."
    );
    const confirm = within(deleteSheet).getByRole("button", {
      name: "Delete and move 5 expenses",
    });
    expect(confirm).toHaveAttribute("aria-disabled", "true");
    expect(
      within(deleteSheet)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(["October 20262", "September 20263"]);

    await user.click(within(deleteSheet).getByRole("combobox", { name: "Set every expense to" }));
    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Food" }));
    await user.click(within(deleteSheet).getByRole("button", { name: "Apply to all" }));
    expect(confirm).toHaveAttribute("aria-disabled", "false");
    await user.click(confirm);

    expect(await screen.findByRole("tab", { name: "Expenses 4" })).toBeInTheDocument();
    expect(await row("Food")).toHaveTextContent("Food8 expenses · Bucket $650.00/mo");

    // The deleted category's bucket is gone; Food's now counts the moved spending.
    await user.click(screen.getByRole("link", { name: "Buckets" }));
    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.queryByText("Eating out")).not.toBeInTheDocument();
    expect(screen.getByTestId("bucket-food-spending")).toHaveTextContent("Spent: $258.90");
  });

  it("lets each entry go to its own category, and keeps Delete unavailable until all have one", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    const sheet = await openCategory(user, "Eating out");
    await user.click(within(sheet).getByRole("button", { name: "Delete category" }));
    const deleteSheet = await screen.findByRole("alertdialog");
    const pick = (description: string, category: string) =>
      user.selectOptions(
        within(deleteSheet).getByRole("combobox", { name: `Category for ${description}` }),
        category
      );

    await pick("Sushi with Ana", "Food");
    await pick("Pizza night", "Food");
    await pick("Coffee & bagel", "Travel");
    await pick("Birthday dinner", "Food");
    expect(within(deleteSheet).getByRole("status")).toHaveTextContent(
      "1 expense still needs a category."
    );
    const confirm = within(deleteSheet).getByRole("button", {
      name: "Delete and move 5 expenses",
    });
    await user.click(confirm);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await pick("Tacos", "Subscriptions");
    await user.click(confirm);

    expect(await screen.findByRole("tab", { name: "Expenses 4" })).toBeInTheDocument();
    expect(await row("Travel")).toHaveTextContent("Travel1 expense");
    expect(await row("Subscriptions")).toHaveTextContent("Subscriptions2 expenses");
    expect(await row("Food")).toHaveTextContent("Food6 expenses");

    // Each expense now sits in the category picked for it: the entry list's
    // rows show the category above the description.
    const entryRow = (description: string) =>
      screen.findByRole("link", { name: new RegExp(description) });
    const openExpenses = async () =>
      user.click(await screen.findByRole("link", { name: /^Expenses \$/ }));
    await user.click(await screen.findByRole("link", { name: /home/i }));
    await openExpenses();
    expect(await entryRow("Sushi with Ana")).toHaveTextContent(/^Food\s*Sushi with Ana/);
    expect(await entryRow("Pizza night")).toHaveTextContent(/^Food\s*Pizza night/);

    // The month switch lives on the dashboard; September holds the other three.
    await user.click(await screen.findByRole("link", { name: /home/i }));
    await goToPrevMonth(user, "September 2026");
    await openExpenses();
    expect(await entryRow("Coffee & bagel")).toHaveTextContent(/^Travel\s*Coffee & bagel/);
    expect(await entryRow("Birthday dinner")).toHaveTextContent(/^Food\s*Birthday dinner/);
    expect(await entryRow("Tacos")).toHaveTextContent(/^Subscriptions\s*Tacos/);
  });

  it("blocks deleting the only category of a type that entries use", async () => {
    seedFixture({ incomeCategories: ["Salary"] });
    const { user } = await renderApp("/categories");

    await user.click(await screen.findByRole("tab", { name: /Incomes/ }));
    const sheet = await openCategory(user, "Salary");
    await user.click(within(sheet).getByRole("button", { name: "Delete category" }));

    const blocked = await screen.findByRole("alertdialog", {
      name: "Can’t delete “Salary” yet",
    });
    expect(blocked).toHaveTextContent(
      "2 incomes use Salary and it is your only income category, so there is nowhere to move them."
    );
    await user.click(within(blocked).getByRole("button", { name: "Add income category" }));
    expect(
      await screen.findByRole("dialog", { name: "New income category" })
    ).toBeInTheDocument();
  });
});

describe("income categories", () => {
  it("are the user's own: a new one is offered by Add income, a renamed one under its new name", async () => {
    seedFixture();
    const { user } = await renderApp("/categories");

    await user.click(await screen.findByRole("tab", { name: /Incomes/ }));
    await user.click(screen.getByRole("button", { name: "Add income category" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Freelance");
    await user.click(screen.getByRole("button", { name: "Create category" }));
    await row("Freelance");

    const sheet = await openCategory(user, "Salary");
    const name = within(sheet).getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "Paycheck");
    await user.click(within(sheet).getByRole("button", { name: "Save changes" }));
    await row("Paycheck");

    await user.click(screen.getByRole("link", { name: "Home" }));
    await user.click(await screen.findByRole("link", { name: "Add Income" }));
    await user.click(await screen.findByRole("combobox", { name: "Category" }));
    const options = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).toEqual(expect.arrayContaining(["Deposit", "Freelance", "Paycheck"]));
    expect(options).not.toContain("Salary");
    expect(options).not.toContain("Saving");
    await user.keyboard("{Escape}");

    await user.type(await screen.findByPlaceholderText(/insert income amount/i), "900");
    await selectCategory(user, "Freelance");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // The new income is listed under its category.
    await user.click(await screen.findByText("Incomes"));
    expect((await screen.findAllByText("Freelance")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paycheck").length).toBeGreaterThan(0);
  });
});

describe("migration from data saved before category lists", () => {
  it("builds the lists from the seeds, old categories, buckets and the categories entries use", async () => {
    localStorage.setItem("categories", JSON.stringify(["Gym"]));
    localStorage.setItem("buckets", JSON.stringify({ Pets: [{ from: "0000-00", limit: 50 }] }));
    seedEntries([
      expense("Yoga", "20", "yoga classes", 3),
      income("Scratch card", "5", "lottery", 2),
    ]);
    const { user } = await renderApp("/categories");

    expect(await row("Gym")).toHaveTextContent("GymNot used yet");
    expect(await row("Pets")).toHaveTextContent("PetsNot used yet · Bucket $50.00/mo");
    expect(await row("Yoga classes")).toHaveTextContent("Yoga classes1 expense");
    expect(await row(/^House \(Rent\)/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Incomes 4" }));
    expect(await row("Lottery")).toHaveTextContent("Lottery1 income");
    expect(await row("Salary")).toBeInTheDocument();
    expect(await row("Deposit")).toBeInTheDocument();
    expect(await row("Saving")).toBeInTheDocument();
    // Thirty seed categories make this screen's role queries slow in jsdom.
  }, 30000);

  it("opens the add sheet from Add bucket when every category has a bucket", async () => {
    localStorage.setItem(
      "categoryLists",
      JSON.stringify({ expense: ["Food"], income: ["Salary"] })
    );
    localStorage.setItem(
      "buckets",
      JSON.stringify({ Food: [{ from: "0000-00", limit: 650 }] })
    );
    const { user } = await renderApp("/add-bucket");

    await user.click(
      await screen.findByRole("link", { name: "Add a new category" })
    );

    expect(
      await screen.findByRole("dialog", { name: "New expense category" })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  });
});
