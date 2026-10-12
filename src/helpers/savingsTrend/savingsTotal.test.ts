import { getRunningTotals, getTotalSaved } from "./savingsTotal";
import type { TrendPoint } from "./savingsTrend.types";

const point = (month: number, savings: number, hasEntries = true): TrendPoint => ({
  year: 2026,
  month,
  savings,
  hasEntries,
});

const APRIL_TO_OCTOBER = [1280, 760, 1050, 1390, 1180, 1440, 1620].map(
  (savings, i) => point(3 + i, savings)
);

describe("getTotalSaved", () => {
  it("adds up every month in the range, both ends included", () => {
    expect(getTotalSaved(APRIL_TO_OCTOBER)).toEqual({
      total: 8720,
      months: 7,
      average: 8720 / 7,
    });
  });

  it("counts a month without entries as zero", () => {
    const points = [point(7, 900), point(8, 0, false), point(9, 300)];
    expect(getTotalSaved(points)).toMatchObject({ total: 1200, months: 3, average: 400 });
  });

  it("is negative when the range spent more than it earned", () => {
    const points = [point(7, -500), point(8, -300), point(9, -800)];
    expect(getTotalSaved(points).total).toBe(-1600);
  });

  it("covers the two months of a one-month range", () => {
    expect(getTotalSaved([point(8, 1440), point(9, 1620)])).toMatchObject({
      total: 3060,
      months: 2,
      average: 1530,
    });
  });
});

describe("getRunningTotals", () => {
  it("accumulates the savings month by month", () => {
    expect(getRunningTotals(APRIL_TO_OCTOBER)).toEqual([
      1280, 2040, 3090, 4480, 5660, 7100, 8720,
    ]);
  });

  it("falls in a month that overspends", () => {
    expect(getRunningTotals([point(7, 900), point(8, -150)])).toEqual([900, 750]);
  });
});
