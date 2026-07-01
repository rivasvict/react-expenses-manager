import { screen, waitFor } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MARCH } from "./helpers/seed";

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

const goPrev = async (user: UserEvent, expected: string) => {
  await user.click(screen.getByRole("button", { name: "Prev" }));
  await screen.findByText(expected);
};
const goNext = async (user: UserEvent, expected: string) => {
  await user.click(screen.getByRole("button", { name: "Next" }));
  await screen.findByText(expected);
};

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
  it("a non-recurring expense is saved to the balance and NOT to fixedEntries", async () => {
    const { user, store } = await renderApp("/");
    await goPrev(user, "April 2026");
    await goPrev(user, "March 2026");

    await addRegularExpense(user, { amount: "80", description: "One-off" });

    // Fixed Entries page must not contain this expense.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    await waitFor(() =>
      expect(screen.queryByText(/Food - One-off/)).not.toBeInTheDocument()
    );

    // Redux store must have no fixed entry definitions.
    expect(store.getState().expensesManager.fixedEntries).toHaveLength(0);

    // localStorage balance must contain the one-off entry.
    const balance = JSON.parse(localStorage.getItem("balance") || "[]");
    expect(balance.some((e: { description: string }) => e.description === "One-off")).toBe(true);

    // localStorage fixedEntries must be empty.
    const stored = JSON.parse(localStorage.getItem("fixedEntries") || "[]");
    expect(stored).toHaveLength(0);
  });

  it("a recurring expense is saved to fixedEntries and NOT to the regular balance", async () => {
    const { user, store } = await renderApp("/");
    await goPrev(user, "April 2026");
    await goPrev(user, "March 2026");

    await addRecurringExpense(user, { amount: "150", description: "Groceries" });

    // Redux store must have exactly one fixed entry definition.
    const { fixedEntries } = store.getState().expensesManager;
    expect(fixedEntries).toHaveLength(1);
    expect(fixedEntries[0].history[0]).toMatchObject({
      from: "2026-03",
      amount: "150",
      description: "Groceries",
    });

    // The entry must be in localStorage fixedEntries, NOT in balance.
    const balance = JSON.parse(localStorage.getItem("balance") || "[]");
    expect(
      balance.some((e: { description: string }) => e.description === "Groceries")
    ).toBe(false);

    const stored = JSON.parse(localStorage.getItem("fixedEntries") || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].history[0]).toMatchObject({ from: "2026-03", amount: "150" });
  });

  it("a recurring expense also materialises into the dashboard monthly list", async () => {
    const { user } = await renderApp("/");
    await goPrev(user, "April 2026");
    await goPrev(user, "March 2026");

    await addRecurringExpense(user, { amount: "200", description: "Groceries" });

    // Back on the dashboard — the fixed entry is materialised into the entries
    // tree so the monthly expense total reflects it.
    await screen.findByRole("link", { name: /add expenses/i });
    expect(await screen.findByText("$200.00")).toBeInTheDocument();
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

    await addRecurringExpense(user, { amount: "100", description: "Groceries" });

    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("May 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });
});

describe("unsetting recurring in the edit form removes from that month forward", () => {
  it("toggling recurring off on edit is equivalent to a forward removal", async () => {
    const { user } = await renderApp("/");
    await goPrev(user, "April 2026");
    await goPrev(user, "March 2026");
    await addRecurringExpense(user, { amount: "200", description: "Groceries" });

    // Navigate to Fixed Entries, go to April, edit, and switch recurring OFF.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    await goNext(user, "April 2026");
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
    await goPrev(user, "March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
  });
});

describe("fixed (recurring) entries reuse the regular entry flow (issue #103)", () => {
  it("creates recurring entries via the toggle, allows several per category, and recurs forward", async () => {
    const { user } = await renderApp("/");

    // Work from March so the recurring entries apply March → May.
    await goPrev(user, "April 2026");
    await goPrev(user, "March 2026");

    await addRecurringExpense(user, { amount: "200", description: "Groceries" });
    await addRecurringExpense(user, { amount: "50", description: "Snacks" });

    // The dedicated Fixed Entries list shows both same-category recurring
    // expenses for March.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
    expect(screen.getByText(/Food - Snacks/)).toBeInTheDocument();

    // They recur into the following months automatically.
    await goNext(user, "April 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
    expect(screen.getByText(/Food - Snacks/)).toBeInTheDocument();
  });

  it("edits and removes a recurring entry from the viewed month forward", async () => {
    const { user } = await renderApp("/");
    await goPrev(user, "April 2026");
    await goPrev(user, "March 2026");
    await addRecurringExpense(user, { amount: "200", description: "Groceries" });
    await addRecurringExpense(user, { amount: "50", description: "Snacks" });

    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await screen.findByText("March 2026");

    // Edit "Snacks" while viewing April → 75 from April forward.
    await goNext(user, "April 2026");
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

    await goPrev(user, "March 2026");
    expect(await screen.findByText("$50.00")).toBeInTheDocument();
    expect(screen.queryByText("$75.00")).not.toBeInTheDocument();

    // Remove "Groceries" while viewing May → gone from May, kept in March.
    await goNext(user, "April 2026");
    await goNext(user, "May 2026");
    await user.click(await screen.findByText(/Food - Groceries/));
    await user.click(
      await screen.findByRole("button", { name: /remove entry/i })
    );

    await screen.findByText("May 2026");
    await waitFor(() =>
      expect(screen.queryByText(/Food - Groceries/)).not.toBeInTheDocument()
    );
    // March still has Groceries.
    await goPrev(user, "April 2026");
    await goPrev(user, "March 2026");
    expect(await screen.findByText(/Food - Groceries/)).toBeInTheDocument();
  });
});
