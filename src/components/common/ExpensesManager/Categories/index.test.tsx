import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../../../redux/store";
import { getCategories } from "../../../../redux/expensesManager/actionCreators";
import Categories from ".";

const renderCategories = async (state?: { addCategory: "expense" | "income" }) => {
  const store = setupStore();
  await act(async () => {
    await store.dispatch(getCategories() as any);
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[{ pathname: "/categories", state }]}>
        <Categories />
      </MemoryRouter>
    </Provider>
  );
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "categoryLists",
    JSON.stringify({ expense: ["Travel", "Food"], income: [] })
  );
});

describe("Categories", () => {
  it("lists the expense categories alphabetically under tabs with counts", async () => {
    await renderCategories();

    expect(screen.getByRole("heading", { level: 1, name: "Categories" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Expenses 2" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Incomes 0" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Not used yet$/ }).map((row) => row.textContent)
    ).toEqual(["FoodNot used yet›", "TravelNot used yet›"]);
  });

  it("shows the empty state on a type without categories", async () => {
    await renderCategories();
    await userEvent.click(screen.getByRole("tab", { name: /Incomes/ }));

    expect(screen.getByRole("heading", { name: "No income categories yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add income category" })).toBeInTheDocument();
  });

  it("opens the add sheet straight away when sent from the old Add category page", async () => {
    await renderCategories({ addCategory: "expense" });
    expect(screen.getByRole("dialog", { name: "New expense category" })).toBeInTheDocument();
  });
});
