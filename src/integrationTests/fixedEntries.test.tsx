import { screen, waitFor } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { seedEntries, ts, MARCH } from "./helpers/seed";

// Pinned so "today" is May 2026 and the navigable header reads stable months.
const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  // A "Food" bucket guarantees the "Food" expense category is available in the
  // fixed-expenses table.
  localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));
  // A single real income in March makes March, April and May navigable.
  seedEntries([
    {
      date: ts(2026, MARCH),
      amount: "100",
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

const foodInput = () =>
  screen.getByTestId("fixed-input-expense-food") as HTMLInputElement;

const expectFoodValue = async (value: string) =>
  waitFor(() => expect(foodInput().value).toBe(value));

describe("fixed (recurring) incomes/expenses (issue #103)", () => {
  it("starts with no fixed amounts for any category", async () => {
    await renderApp("/fixed-entries");

    expect(foodInput().value).toBe("");
    expect(
      (screen.getByTestId("fixed-input-income-salary") as HTMLInputElement).value
    ).toBe("");
  });

  it("applies a fixed expense from a month forward, and edits/removals only affect that month onward", async () => {
    const { user } = await renderApp("/fixed-entries");

    // Move the header from May back to March (two months back).
    await user.click(screen.getByRole("button", { name: "Prev" }));
    await screen.findByText("April 2026");
    await user.click(screen.getByRole("button", { name: "Prev" }));
    await screen.findByText("March 2026");

    // Set a fixed Food expense of 200 effective from March.
    await user.type(foodInput(), "200");
    await user.click(screen.getByTestId("fixed-save-expense-food"));
    await expectFoodValue("200");

    // It is materialized as a real expense: the dashboard for March nets the
    // 100 income against the 200 fixed expense (forward-only end-to-end).
    await user.click(screen.getByRole("link", { name: /home/i }));
    await waitFor(() =>
      expect(screen.getByTitle("Summary")).toHaveTextContent("-$100.00")
    );

    // Back to fixed entries (selected month is still March) and walk forward:
    // the fixed amount applies to March, April and May.
    await user.click(screen.getByRole("link", { name: /fixed entries/i }));
    await expectFoodValue("200");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("April 2026");
    await expectFoodValue("200");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("May 2026");
    await expectFoodValue("200");

    // Edit the amount while viewing May: it drops to 50 from May forward only.
    await user.clear(foodInput());
    await user.type(foodInput(), "50");
    await user.click(screen.getByTestId("fixed-save-expense-food"));
    await expectFoodValue("50");

    // April and March keep the previous 200 (the edit did not reach back).
    await user.click(screen.getByRole("button", { name: "Prev" }));
    await screen.findByText("April 2026");
    await expectFoodValue("200");

    // Remove the fixed expense while viewing April: April onward loses it, but
    // the later May change (50) and the earlier March value (200) are kept.
    await user.click(screen.getByTestId("fixed-remove-expense-food"));
    await expectFoodValue("");

    await user.click(screen.getByRole("button", { name: "Prev" }));
    await screen.findByText("March 2026");
    await expectFoodValue("200");

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("April 2026");
    await expectFoodValue("");

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("May 2026");
    await expectFoodValue("50");
  });
});
