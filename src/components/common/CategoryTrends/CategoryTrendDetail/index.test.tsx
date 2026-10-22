import { screen } from "@testing-library/react";
import { renderApp } from "../../../../integrationTests/helpers/renderApp";
import { seedEntries, ts, APRIL, OCTOBER } from "../../../../integrationTests/helpers/seed";

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-15T12:00:00Z"));
  seedEntries([
    { date: ts(2026, APRIL), amount: "100", type: "expense", categories_path: ",food," },
    { date: ts(2026, OCTOBER), amount: "120", type: "expense", categories_path: ",food," },
  ]);
  localStorage.setItem("categoryLists", JSON.stringify({ expense: ["Food"], income: [] }));
});

afterEach(() => jest.useRealTimers());

describe("CategoryTrendDetail", () => {
  it("opens a category on Per month, whatever the case in the address", async () => {
    await renderApp("/category-trends/expense/FOOD");

    const headline = await screen.findByRole("group", { name: "Food, Apr – Oct" });
    expect(headline).toHaveTextContent("$220.00");
    expect(screen.getByRole("button", { name: "Expense category: Food. Change" })).toBeInTheDocument();
  });

  it("sends an unknown category type back to the list", async () => {
    await renderApp("/category-trends/savings/Food");
    expect(await screen.findByRole("heading", { name: "Category trends" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "All categories" })).not.toBeInTheDocument();
  });
});
