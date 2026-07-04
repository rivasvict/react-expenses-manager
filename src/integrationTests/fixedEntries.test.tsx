import { screen, waitFor } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MARCH } from "./helpers/seed";
import { goToPrevMonth, goToNextMonth } from "./helpers/navigation";

// Pinned so "today" is May 2026 and the navigable header reads stable months.
const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  // A single real income in March makes March, April and May navigable.
  seedEntries([
    {
      date: ts(2026, MARCH),
      amount: "1000",
      type: "income",
      categories_path: ",salary,",
    },
  ]);
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

// Adds a recurring expense from the dashboard using the normal Add Expense
// form with the "Recurring" toggle switched on.
const addRecurringExpense = async (
  user: UserEvent,
  { amount, description }: { amount: string; description: string }
) => {
  await user.click(await screen.findByRole("link", { name: /add expenses/i }));
  await user.type(
    await screen.findByPlaceholderText(/insert expense amount/i),
    amount
  );
  await user.type(screen.getByPlaceholderText(/description/i), description);
  await user.selectOptions(
    screen.getByRole("combobox"),
    screen.getByRole("option", { name: "Food" })
  );
  await user.click(screen.getByLabelText(/recurring/i));
  await user.click(screen.getByRole("button", { name: /submit/i }));
  // Back on the dashboard after submitting.
  await screen.findByRole("link", { name: /add expenses/i });
};

// Adds a one-off (non-recurring) expense via the same form but WITHOUT the toggle.
const addRegularExpense = async (
  user: UserEvent,
  { amount, description }: { amount: string; description: string }
) => {
  await user.click(await screen.findByRole("link", { name: /add expenses/i }));
  await user.type(
    await screen.findByPlaceholderText(/insert expense amount/i),
    amount
  );
  await user.type(screen.getByPlaceholderText(/description/i), description);
  await user.selectOptions(
    screen.getByRole("combobox"),
    screen.getByRole("option", { name: "Food" })
  );
  // Recurring toggle is intentionally NOT clicked.
  await user.click(screen.getByRole("button", { name: /submit/i }));
  await screen.findByRole("link", { name: /add expenses/i });
};

describe("toggle routing — recurring vs regular entries", () => {
  it("a non-recurring expense appears in the regular expenses view and NOT in Fixed Entries", async () => {
    const { user } = await renderApp("/");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");

    await addRegularExpense(user, { amount: "80", description: "One-off" });

    // The "Add Expenses" link is only rendered on the dashboard, confirming we
    // are back there after submitting.
    await screen.findByRole("link", { name: /add expenses/i });

    // The expense must be visible in the regular expenses view.
    await user.click(screen.getByRole("link", { name: /^Expenses \$/ }));
    expect(await screen.findByText(/Food - One-off/)).toBeInTheDocument();

    // It must NOT appear on the Fixed Entries page.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    await waitFor(() =>
      expect(screen.queryByText(/Food - One-off/)).not.toBeInTheDocument()
    );
  });

  it("a recurring expense appears in both the regular expenses view and the Fixed Entries page", async () => {
    const { user } = await renderApp("/");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");

    await addRecurringExpense(user, { amount: "150", description: "Groceries" });

    // The "Add Expenses" link is only rendered on the dashboard.
    await screen.findByRole("link", { name: /add expenses/i });

    // Fixed entries are materialised into the entries tree, so the entry must
    // appear in the regular expenses view as well as the Fixed Entries page.
    await user.click(screen.getByRole("link", { name: /^Expenses \$/ }));
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();

    // It must also appear on the dedicated Fixed Entries page.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
  });

  it("a recurring expense materialises into the dashboard total and is visible on the Fixed Entries page", async () => {
    const { user } = await renderApp("/");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");

    await addRecurringExpense(user, { amount: "200", description: "Groceries" });

    // The "Add Expenses" link is only rendered on the dashboard, so finding it
    // confirms we are back on the dashboard after submitting.
    await screen.findByRole("link", { name: /add expenses/i });
    // The fixed entry is materialised into the entries tree so the monthly total reflects it.
    expect(await screen.findByText("$200.00")).toBeInTheDocument();

    // The Fixed Entries page must also list the new recurring entry.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
  });
});

describe("fixed entries without any prior regular entries", () => {
  beforeEach(() => {
    // Remove the seed added by the outer beforeEach so localStorage is empty.
    localStorage.clear();
  });

  it("adds and displays a fixed expense for the current month", async () => {
    // With no prior entries, only May 2026 (pinned today) is in the tree —
    // no Prev / Next navigation buttons should be visible.
    const { user } = await renderApp("/");
    await screen.findByText("May 2026");
    expect(screen.queryByRole("button", { name: "Prev" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();

    await addRecurringExpense(user, { amount: "100", description: "Groceries" });

    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("May 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });
});

describe("Recurring toggle is pre-checked when adding from the Fixed Entries page", () => {
  it("Add Expense from Fixed Entries opens the form with the Recurring toggle already ON", async () => {
    const { user } = await renderApp("/");
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("May 2026");

    await user.click(screen.getByRole("link", { name: /add expense/i }));

    // The toggle must be checked without the user touching it.
    const toggle = await screen.findByLabelText(/recurring/i);
    expect((toggle as HTMLInputElement).checked).toBe(true);
  });

  it("Add Income from Fixed Entries opens the form with the Recurring toggle already ON", async () => {
    const { user } = await renderApp("/");
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("May 2026");

    await user.click(screen.getByRole("link", { name: /add income/i }));

    const toggle = await screen.findByLabelText(/recurring/i);
    expect((toggle as HTMLInputElement).checked).toBe(true);
  });
});

describe("toggling recurring ON in the edit form converts a one-off entry to a fixed one", () => {
  it("promotes a regular expense to recurring via the edit form recurring toggle", async () => {
    // Seed a known coffee expense so we can navigate to its edit URL directly.
    // (Replaces the outer beforeEach seed — March income not needed here.)
    const [coffeeEntry] = seedEntries([
      {
        date: ts(2026, MARCH),
        amount: "90",
        description: "Coffee",
        type: "expense",
        categories_path: ",food,",
      },
    ]);

    // Open its edit form directly (PINNED_DATE is May 2026 so selectedDate = May).
    const { user } = await renderApp(`/edit-expense/${coffeeEntry.id}`);

    // The recurring toggle must be OFF for a plain one-off entry.
    const toggle = await screen.findByLabelText(/recurring/i);
    expect((toggle as HTMLInputElement).checked).toBe(false);

    // Switch it to recurring and submit.
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // After submit the form navigates back; find the Fixed Entries nav link and
    // go there — findByRole's built-in retry waits for the async thunk to settle.
    await user.click(await screen.findByRole("link", { name: /fixed entries/i }));
    // The entry must be listed under May 2026 (the currently viewed month when
    // the promotion happens) with the correct amount.
    await screen.findByText("May 2026");
    expect(await screen.findByText(/Food - Coffee/)).toBeInTheDocument();
    expect(screen.getByText("$90.00")).toBeInTheDocument();

    // Fixed entries are also materialised into the regular expenses view.
    await user.click(screen.getByRole("link", { name: /home/i }));
    // The "Add Expenses" link is only rendered on the dashboard.
    await screen.findByRole("link", { name: /add expenses/i });
    await user.click(screen.getByRole("link", { name: /^Expenses \$/ }));
    expect(await screen.findByText(/Food - Coffee/)).toBeInTheDocument();
  });
});

describe("unsetting recurring in the edit form removes from that month forward", () => {
  it("toggling recurring off on edit is equivalent to a forward removal", async () => {
    const { user } = await renderApp("/");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    await addRecurringExpense(user, { amount: "200", description: "Groceries" });

    // Navigate to Fixed Entries, go to April, edit, and switch recurring OFF.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    await goToNextMonth(user, "April 2026");
    await user.click(await screen.findByText(/Food - Groceries/));
    // The recurring toggle is on by default when editing a fixed entry.
    const toggle = await screen.findByLabelText(/recurring/i);
    expect((toggle as HTMLInputElement).checked).toBe(true);
    // Switch it off.
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // April no longer shows Groceries.
    await screen.findByText("April 2026");
    await waitFor(() =>
      expect(screen.queryByText(/Food - Groceries/)).not.toBeInTheDocument()
    );

    // March still has Groceries (forward-only removal).
    await goToPrevMonth(user, "March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
  });
});

describe("fixed (recurring) entries reuse the regular entry flow (issue #103)", () => {
  it("creates recurring entries via the toggle, allows several per category, and recurs forward", async () => {
    const { user } = await renderApp("/");

    // Work from March so the recurring entries apply March → May.
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");

    await addRecurringExpense(user, { amount: "200", description: "Groceries" });
    await addRecurringExpense(user, { amount: "50", description: "Snacks" });

    // The dedicated Fixed Entries list shows both same-category recurring
    // expenses for March.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
    expect(screen.getByText(/Food - Snacks/)).toBeInTheDocument();

    // They recur into the following months automatically.
    await goToNextMonth(user, "April 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
    expect(screen.getByText(/Food - Snacks/)).toBeInTheDocument();
  });

  it("edits and removes a recurring entry from the viewed month forward", async () => {
    const { user } = await renderApp("/");
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    await addRecurringExpense(user, { amount: "200", description: "Groceries" });
    await addRecurringExpense(user, { amount: "50", description: "Snacks" });

    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");

    // Edit "Snacks" while viewing April → 75 from April forward.
    await goToNextMonth(user, "April 2026");
    await user.click(await screen.findByText(/Food - Snacks/));
    const amountInput = await screen.findByPlaceholderText(
      /insert expense amount/i
    );
    await user.clear(amountInput);
    await user.type(amountInput, "75");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    // April now shows 75; March keeps the original 50 (forward-only edit).
    // The amounts uniquely identify the Snacks row across the two months.
    await screen.findByText("April 2026");
    expect(await screen.findByText("$75.00")).toBeInTheDocument();
    expect(screen.queryByText("$50.00")).not.toBeInTheDocument();

    await goToPrevMonth(user, "March 2026");
    expect(await screen.findByText("$50.00")).toBeInTheDocument();
    expect(screen.queryByText("$75.00")).not.toBeInTheDocument();

    // Remove "Groceries" while viewing May → gone from May, kept in March.
    await goToNextMonth(user, "April 2026");
    await goToNextMonth(user, "May 2026");
    await user.click(await screen.findByText(/Food - Groceries/));
    await user.click(
      await screen.findByRole("button", { name: /remove entry/i })
    );

    await screen.findByText("May 2026");
    await waitFor(() =>
      expect(screen.queryByText(/Food - Groceries/)).not.toBeInTheDocument()
    );
    // March still has Groceries.
    await goToPrevMonth(user, "April 2026");
    await goToPrevMonth(user, "March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
  });
});
