import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Route, Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import CategoryTrends from ".";
import WithBalance from "../../WithBalance";
import { setupStore } from "../../../redux/store";
import { LanguageProvider } from "../../../i18n";
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

  it("keeps the picked tab when the user comes back with the browser's Back", async () => {
    seedEntries([
      entry(APRIL, "100", ",food,"),
      entry(OCTOBER, "120", ",food,"),
      { date: ts(2026, APRIL), amount: "500", type: "income", categories_path: ",bonus," },
      { date: ts(2026, OCTOBER), amount: "300", type: "income", categories_path: ",bonus," },
    ]);
    localStorage.setItem("categoryLists", JSON.stringify({ expense: ["Food"], income: ["Bonus"] }));
    const history = createMemoryHistory({ initialEntries: ["/category-trends"] });
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <Provider store={setupStore()}>
        <LanguageProvider>
          <Router history={history}>
            <WithBalance>
              <Route exact path="/category-trends">
                <CategoryTrends />
              </Route>
            </WithBalance>
          </Router>
        </LanguageProvider>
      </Provider>
    );

    await user.click(await screen.findByRole("tab", { name: "Incomes" }));
    await user.click(screen.getByRole("link", { name: /^Bonus/ }));
    expect(history.location.pathname).toBe("/category-trends/income/Bonus");
    act(() => history.goBack());

    expect(await screen.findByRole("tab", { name: "Incomes" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("link", { name: /^Bonus/ })).toBeInTheDocument();
  });
});
