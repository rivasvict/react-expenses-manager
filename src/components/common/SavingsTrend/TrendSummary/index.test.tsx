import React from "react";
import { render, screen } from "@testing-library/react";
import TrendSummary from ".";
import { LanguageProvider } from "../../../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../../../i18n/languagePreference";
import type { SavingsTrend } from "../../../../helpers/savingsTrend/savingsTrend.types";

const point = (year: number, month: number, savings: number, hasEntries = true) => ({
  year,
  month,
  savings,
  hasEntries,
});

const trendOf = (overrides: Partial<SavingsTrend>): SavingsTrend => {
  const reference = point(2026, 3, 1280);
  const end = point(2026, 9, 1620);
  return {
    points: [reference, end],
    reference,
    end,
    difference: 340,
    change: { kind: "up", percent: 26.6 },
    ...overrides,
  };
};

const renderSummary = (trend: SavingsTrend) =>
  render(
    <LanguageProvider>
      <TrendSummary trend={trend} />
    </LanguageProvider>
  );

afterEach(() => localStorage.clear());

describe("TrendSummary", () => {
  it("compares the end month with the reference month by amount and percentage", () => {
    renderSummary(trendOf({}));
    const summary = screen.getByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("+$340.00");
    expect(summary).toHaveTextContent("+26.6%");
    expect(summary).toHaveTextContent("$1,620.00 vs $1,280.00");
  });

  it("shows a drop in red terms: a true minus on the amount and the pill", () => {
    renderSummary(
      trendOf({ difference: -380, change: { kind: "down", percent: 29.7 } })
    );
    const summary = screen.getByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("−$380.00");
    expect(summary).toHaveTextContent("−29.7%");
  });

  it("adds the year to both months when the range crosses years", () => {
    renderSummary(trendOf({ reference: point(2025, 9, 820) }));
    expect(
      screen.getByRole("group", { name: "October 2026 vs October 2025" })
    ).toBeInTheDocument();
  });

  it("drops the percentage but keeps the amount when it cannot be compared", () => {
    renderSummary(
      trendOf({ reference: point(2026, 3, 0, false), difference: 1620, change: { kind: "none" } })
    );
    const summary = screen.getByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("+$1,620.00");
    expect(summary).not.toHaveTextContent("%");
  });

  it("keeps a flat result neutral and unsigned", () => {
    renderSummary(trendOf({ difference: 0, change: { kind: "flat", percent: 0 } }));
    const summary = screen.getByRole("group", { name: "October vs April" });
    expect(summary).toHaveTextContent("$0.00");
    expect(summary).toHaveTextContent("0.0%");
  });

  it("is translated, with month names in lower case mid-sentence", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderSummary(trendOf({}));
    expect(
      screen.getByRole("group", { name: "Octubre frente a abril" })
    ).toBeInTheDocument();
  });
});
