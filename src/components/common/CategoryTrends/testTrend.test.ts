import { makeTrend } from "./testTrend";

describe("makeTrend", () => {
  it("builds a trend from April with one amount per month", () => {
    const trend = makeTrend("expense", "Food", [720, 610]);
    expect(trend.reference).toMatchObject({ year: 2026, month: 3, amount: 720 });
    expect(trend.end).toMatchObject({ year: 2026, month: 4, amount: 610 });
  });
});
