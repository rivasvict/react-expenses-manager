import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";

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
    await user.selectOptions(screen.getByRole("combobox"), "Eating out");

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
    await user.selectOptions(screen.getByRole("combobox"), "Salary");

    await user.click(screen.getByRole("button", { name: /submit/i }));

    // Back on dashboard: incomes row shows the new amount
    expect(await screen.findByText("$1,000.00")).toBeInTheDocument();
  });

  it("user can edit an entry immediately after creating it", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.type(await screen.findByPlaceholderText(/insert expense amount/i), "50");
    await user.type(screen.getByPlaceholderText(/description/i), "Groceries");
    await user.selectOptions(screen.getByRole("combobox"), "Food");
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

  // TODO: No date picker exists in the UI. Entries always receive the current
  // timestamp (set at submit time in AddEntry). There is no way for the user to
  // create or move an entry to a past month through the UI.
  // Re-enable once a date picker is added to EntryForm.
  it.skip("user can add/edit/remove an entry from a previous month", () => {});
});
