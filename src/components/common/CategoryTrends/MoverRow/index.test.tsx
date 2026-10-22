import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MoverRow from ".";
import { LanguageProvider } from "../../../../i18n";
import { makeTrend } from "../testTrend";

afterEach(() => localStorage.clear());

const renderRow = (trend: ReturnType<typeof makeTrend>) =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <MoverRow trend={trend} reference="April" />
      </MemoryRouter>
    </LanguageProvider>
  );

describe("MoverRow", () => {
  it("links to the category with its amount, what it was and a whole-percent pill", () => {
    renderRow(makeTrend("expense", "Eating out", [380, 540]));
    const row = screen.getByRole("link", { name: "Eating out, $540.00, +42% vs April" });
    // The router shows the path decoded; categoryTrendPath encodes it.
    expect(row).toHaveAttribute("href", "/category-trends/expense/Eating out");
    expect(row).toHaveTextContent("was $380.00");
    expect(screen.getByText("+42%")).toHaveClass("change-pill--bad");
  });

  it("colours less spent as good news", () => {
    renderRow(makeTrend("expense", "Food", [720, 610]));
    expect(screen.getByText("−15%")).toHaveClass("change-pill--good");
  });

  it("marks a category that had nothing in the reference month as new", () => {
    renderRow(makeTrend("expense", "Gym", [0, 30]));
    expect(screen.getByRole("link", { name: "Gym, $30.00, new, was $0.00" })).toHaveTextContent("New");
  });
});
