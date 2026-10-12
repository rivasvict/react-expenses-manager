import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  describe("with tabs", () => {
    const renderTabbed = (view: "total" | "change", trend = trendOf({})) => {
      const onViewChange = jest.fn();
      render(
        <LanguageProvider>
          <TrendSummary trend={trend} view={view} onViewChange={onViewChange} />
        </LanguageProvider>
      );
      return { onViewChange };
    };

    it("has no tabs unless it is given a way to change view", () => {
      renderSummary(trendOf({}));
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("shows the total saved over every month of the range on the Total saved tab", () => {
      const points = [1280, 760, 1050].map((savings, i) => point(2026, 3 + i, savings));
      renderTabbed(
        "total",
        trendOf({ points, reference: points[0], end: points[2] })
      );
      const summary = screen.getByRole("group", { name: "Total saved, Apr – Jun" });
      expect(summary).toHaveTextContent("$3,090.00");
      expect(summary).toHaveTextContent("3 months · $1,030.00 avg per month");
      expect(screen.getByRole("tab", { name: "Total saved" })).toHaveAttribute("aria-selected", "true");
    });

    it("names the year on both ends of a range that crosses years", () => {
      const points = [point(2025, 9, 820), point(2026, 9, 1620)];
      renderTabbed("total", trendOf({ points, reference: points[0], end: points[1] }));
      expect(
        screen.getByRole("group", { name: "Total saved, Oct 2025 \u2013 Oct 2026" })
      ).toBeInTheDocument();
    });

    it("shows the comparison on the Change tab, with the Change tab selected", () => {
      renderTabbed("change");
      expect(screen.getByRole("group", { name: "October vs April" })).toHaveTextContent("+$340.00");
      expect(screen.getByRole("tab", { name: "Change" })).toHaveAttribute("aria-selected", "true");
    });

    it("asks for the other view when its tab is clicked", async () => {
      const { onViewChange } = renderTabbed("total");
      await userEvent.click(screen.getByRole("tab", { name: "Change" }));
      expect(onViewChange).toHaveBeenCalledWith("change");
    });

    it("shows a negative total in the expense terms with a true minus", () => {
      const points = [point(2026, 7, -500), point(2026, 9, -800)];
      renderTabbed("total", trendOf({ points, reference: points[0], end: points[1] }));
      expect(screen.getByText("−$1,300.00")).toHaveClass("trend-summary__amount--down");
    });
  });
});
