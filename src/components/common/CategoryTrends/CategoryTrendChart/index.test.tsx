/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   the marks are decorative SVG with no role; their classes are what they draw. */
import React from "react";
import { render, screen } from "@testing-library/react";
import CategoryTrendChart from ".";
import { LanguageProvider } from "../../../../i18n";
import { makeTrend } from "../testTrend";

afterEach(() => localStorage.clear());

const renderChart = (view: "perMonth" | "change", trend = makeTrend("expense", "Eating out", [380, 420, 540])) =>
  render(
    <LanguageProvider>
      <CategoryTrendChart trend={trend} view={view} />
    </LanguageProvider>
  );

describe("CategoryTrendChart", () => {
  it("describes the chart and lists its months", () => {
    renderChart("perMonth");
    expect(screen.getByRole("img", { name: "Eating out per month, April 2026 to June 2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
    expect(screen.getByText("Spending is up from April")).toBeInTheDocument();
  });

  it("draws more spent over the range in red on Per month", () => {
    const { container } = renderChart("perMonth");
    expect(container.querySelector(".category-trend-chart__line--bad")).toBeInTheDocument();
    expect(container.querySelector(".category-trend-chart__dot--bad")).toBeInTheDocument();
    expect(
      screen.getByText("Red when you spent more in June than in April, green when you spent less.")
    ).toBeInTheDocument();
  });

  it("draws less spent over the range in green on Per month", () => {
    const { container } = renderChart("perMonth", makeTrend("expense", "Eating out", [540, 420, 380]));
    expect(container.querySelector(".category-trend-chart__line--good")).toBeInTheDocument();
    expect(screen.getByText("Spending is down from April")).toBeInTheDocument();
  });

  it("draws more earned in green on Per month", () => {
    const { container } = renderChart("perMonth", makeTrend("income", "Freelance", [200, 650]));
    expect(container.querySelector(".category-trend-chart__line--good")).toBeInTheDocument();
    expect(screen.getByText("Income is up from April")).toBeInTheDocument();
  });

  it("draws less earned in red on Per month", () => {
    const { container } = renderChart("perMonth", makeTrend("income", "Freelance", [650, 200]));
    expect(container.querySelector(".category-trend-chart__line--bad")).toBeInTheDocument();
    expect(screen.getByText("Income is down from April")).toBeInTheDocument();
  });

  it("draws an unchanged category in grey on Per month", () => {
    const { container } = renderChart("perMonth", makeTrend("expense", "Eating out", [380, 420, 380]));
    expect(container.querySelector(".category-trend-chart__line--flat")).toBeInTheDocument();
    expect(screen.getByText("Spending is the same as in April")).toBeInTheDocument();
  });

  it("marks more spent than the reference month as bad on Change", () => {
    const { container } = renderChart("change");
    expect(container.querySelector(".category-trend-chart__dot--bad")).toBeInTheDocument();
    expect(screen.getByText("Spent in April")).toBeInTheDocument();
  });

  it("marks more earned as good for an income category", () => {
    const { container } = renderChart("change", makeTrend("income", "Freelance", [200, 650]));
    expect(container.querySelector(".category-trend-chart__dot--good")).toBeInTheDocument();
    expect(
      screen.getByText("Green where you earned more than in April, red where you earned less.")
    ).toBeInTheDocument();
  });
});
