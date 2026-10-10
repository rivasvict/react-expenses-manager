import React from "react";
import { render, screen } from "@testing-library/react";
import SavingsChangeBadge from ".";
import { EntriesTree } from "../../../helpers/savingsChange/savingsChange";
import { LanguageProvider } from "../../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../../i18n/languagePreference";

const income = (amount: string) => ({ amount, type: "income" });
const expense = (amount: string) => ({ amount, type: "expense" });

const OCTOBER = { year: 2026, month: 9 };

const withOctoberSavings = (octoberExpenses: string) => ({
  2026: {
    8: { incomes: [income("4000")], expenses: [expense("2560")] },
    9: { incomes: [income("4200")], expenses: [expense(octoberExpenses)] },
  },
});

const renderBadge = (entries: EntriesTree, selectedDate = OCTOBER) =>
  render(
    <LanguageProvider>
      <SavingsChangeBadge entries={entries} selectedDate={selectedDate} />
    </LanguageProvider>
  );

afterEach(() => localStorage.clear());

describe("SavingsChangeBadge", () => {
  it("shows a rise as a plus percentage against the previous month", () => {
    renderBadge(withOctoberSavings("2580"));
    expect(
      screen.getByRole("img", {
        name: "Savings up 12.5% compared with September",
      })
    ).toHaveTextContent("+12.5%vs Sep");
  });

  it("shows a drop with a minus sign", () => {
    renderBadge(withOctoberSavings("2940"));
    expect(
      screen.getByRole("img", {
        name: "Savings down 12.5% compared with September",
      })
    ).toHaveTextContent("−12.5%vs Sep");
  });

  it("shows no change without a sign", () => {
    renderBadge(withOctoberSavings("2760"));
    expect(
      screen.getByRole("img", {
        name: "Savings unchanged compared with September",
      })
    ).toHaveTextContent("0.0%vs Sep");
  });

  it("says there is nothing to compare when the previous month is empty", () => {
    renderBadge({ 2026: { 9: { incomes: [income("10")], expenses: [] } } });
    expect(
      screen.getByText("Nothing to compare with Sep")
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("names the short December when January is selected", () => {
    renderBadge({}, { year: 2026, month: 0 });
    expect(
      screen.getByText("Nothing to compare with Dec")
    ).toBeInTheDocument();
  });

  it("writes the month in lowercase in Spanish: short in the caption, full when spoken", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderBadge(withOctoberSavings("2580"));
    expect(
      screen.getByRole("img", {
        name: "El ahorro subió un 12.5% respecto a septiembre",
      })
    ).toHaveTextContent("+12.5%frente a sep");
  });
});
