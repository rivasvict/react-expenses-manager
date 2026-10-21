import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryTrendSummary from ".";
import { LanguageProvider } from "../../../../i18n";
import { makeTrend } from "../testTrend";
import type { CategoryTrendView } from "../CategoryTrendChart";

afterEach(() => localStorage.clear());

const EATING_OUT = makeTrend("expense", "Eating out", [380, 420, 350, 460, 410, 520, 540]);

const renderSummary = (view: CategoryTrendView, trend = EATING_OUT) => {
  const onViewChange = jest.fn();
  render(
    <LanguageProvider>
      <CategoryTrendSummary trend={trend} view={view} onViewChange={onViewChange} />
    </LanguageProvider>
  );
  return { onViewChange };
};

describe("CategoryTrendSummary", () => {
  it("shows the range's total and monthly average on Per month", () => {
    renderSummary("perMonth");
    const card = screen.getByRole("group", { name: "Eating out, Apr – Oct" });
    expect(card).toHaveTextContent("$3,080.00");
    expect(card).toHaveTextContent("7 months · $440.00 avg per month");
  });

  it("compares the end month with the reference month on Change", () => {
    renderSummary("change");
    const card = screen.getByRole("group", { name: "Eating out, October vs April" });
    expect(card).toHaveTextContent("+$160.00");
    expect(within(card).getByText("+42.1%")).toHaveClass("change-pill--bad");
    expect(card).toHaveTextContent("$540.00 vs $380.00");
  });

  it("says New when the reference month had nothing", () => {
    renderSummary("change", makeTrend("expense", "Gym", [0, 30]));
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("switches tabs", async () => {
    const { onViewChange } = renderSummary("perMonth");
    await userEvent.click(screen.getByRole("tab", { name: "Change" }));
    expect(onViewChange).toHaveBeenCalledWith("change");
  });
});
