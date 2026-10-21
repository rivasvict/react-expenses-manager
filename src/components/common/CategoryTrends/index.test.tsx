import { screen } from "@testing-library/react";
import { renderApp } from "../../../integrationTests/helpers/renderApp";
import { seedEntries, ts, APRIL, OCTOBER } from "../../../integrationTests/helpers/seed";

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-10-15T12:00:00Z"));
});

afterEach(() => jest.useRealTimers());

const entry = (month: number, amount: string, path: string) => ({
  date: ts(2026, month),
  amount,
  type: "expense" as const,
  categories_path: path,
});

describe("CategoryTrends", () => {
  it("ranks the expense categories of the range", async () => {
    seedEntries([
      entry(APRIL, "100", ",food,"),
      entry(OCTOBER, "120", ",food,"),
      entry(APRIL, "40", ",gym,"),
      entry(OCTOBER, "80", ",gym,"),
    ]);
    localStorage.setItem("categoryLists", JSON.stringify({ expense: ["Food", "Gym"], income: [] }));
    await renderApp("/category-trends");

    const rows = await screen.findAllByRole("link", { name: /vs April/ });
    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Gym, $80.00, +100% vs April",
      "Food, $120.00, +20% vs April",
    ]);
  });

  it("offers to add an income when the range has none", async () => {
    seedEntries([entry(APRIL, "100", ",food,"), entry(OCTOBER, "120", ",food,")]);
    localStorage.setItem("categoryLists", JSON.stringify({ expense: ["Food"], income: ["Salary"] }));
    const { user } = await renderApp("/category-trends");

    await user.click(await screen.findByRole("tab", { name: "Incomes" }));
    expect(screen.getByText("No incomes between April and October")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add income" })).toBeInTheDocument();
  });
});
