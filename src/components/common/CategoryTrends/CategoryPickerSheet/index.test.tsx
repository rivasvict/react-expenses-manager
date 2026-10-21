import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryPickerSheet from ".";
import { LanguageProvider } from "../../../../i18n";

afterEach(() => localStorage.clear());

const renderSheet = () => {
  const onPick = jest.fn();
  const onClose = jest.fn();
  render(
    <LanguageProvider>
      <CategoryPickerSheet
        categoryLists={{ expense: ["Eating out", "Food"], income: ["Salary"] }}
        current={{ type: "expense", name: "Eating out" }}
        amountOf={({ name }) => (name === "Food" ? 610 : 0)}
        onPick={onPick}
        onClose={onClose}
      />
    </LanguageProvider>
  );
  return { onPick, onClose };
};

describe("CategoryPickerSheet", () => {
  it("groups the categories by type, with the end month's amount and the current one checked", () => {
    renderSheet();
    const expenses = screen.getByRole("radiogroup", { name: "Expense categories" });
    expect(within(expenses).getAllByRole("radio")).toHaveLength(2);
    expect(within(expenses).getByRole("radio", { name: /Eating out/ })).toHaveAttribute("aria-checked", "true");
    expect(within(expenses).getByRole("radio", { name: /Food/ })).toHaveTextContent("$610.00");
    expect(screen.getByRole("radiogroup", { name: "Income categories" })).toBeInTheDocument();
  });

  it("applies a pick and closes", async () => {
    const { onPick, onClose } = renderSheet();
    await userEvent.click(screen.getByRole("radio", { name: /Salary/ }));
    expect(onPick).toHaveBeenCalledWith({ type: "income", name: "Salary" });
    expect(onClose).toHaveBeenCalled();
  });
});
