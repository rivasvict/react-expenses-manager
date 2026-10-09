import {
  formatPercent,
  getPreviousMonth,
  getSavingsChange,
} from "./savingsChange";

const income = (amount: string) => ({ amount, type: "income" });
const expense = (amount: string) => ({ amount, type: "expense" });

const month = (incomes: object[], expenses: object[]) => ({
  incomes,
  expenses,
});

const OCTOBER = { year: 2026, month: 9 };

describe("getPreviousMonth", () => {
  it("steps back within the year", () => {
    expect(getPreviousMonth(OCTOBER)).toEqual({ year: 2026, month: 8 });
  });

  it("steps back from January into December of the year before", () => {
    expect(getPreviousMonth({ year: 2026, month: 0 })).toEqual({
      year: 2025,
      month: 11,
    });
  });
});

describe("getSavingsChange", () => {
  it("reports a rise relative to the previous month's savings", () => {
    const entries = {
      2026: {
        8: month([income("4000")], [expense("2560")]),
        9: month([income("4200")], [expense("2580")]),
      },
    };
    expect(getSavingsChange(entries, OCTOBER)).toEqual({
      kind: "up",
      percent: 12.5,
    });
  });

  it("reports a drop as a positive percent of kind down", () => {
    const entries = {
      2026: {
        8: month([income("4000")], [expense("2560")]),
        9: month([income("4200")], [expense("2940")]),
      },
    };
    expect(getSavingsChange(entries, OCTOBER)).toEqual({
      kind: "down",
      percent: 12.5,
    });
  });

  it("reports no change when the percent rounds to 0.0", () => {
    const entries = {
      2026: {
        8: month([income("1000")], []),
        9: month([income("1000.04")], []),
      },
    };
    expect(getSavingsChange(entries, OCTOBER)).toEqual({
      kind: "flat",
      percent: 0,
    });
  });

  it("compares against the size of negative previous savings", () => {
    const entries = {
      2026: {
        8: month([], [expense("200")]),
        9: month([income("100")], []),
      },
    };
    expect(getSavingsChange(entries, OCTOBER)).toEqual({
      kind: "up",
      percent: 150,
    });
  });

  it("reads a month without entries as $0.00 savings, a full drop", () => {
    const entries = { 2026: { 8: month([income("500")], []) } };
    expect(getSavingsChange(entries, OCTOBER)).toEqual({
      kind: "down",
      percent: 100,
    });
  });

  it("compares January with December of the year before", () => {
    const entries = {
      2025: { 11: month([income("100")], []) },
      2026: { 0: month([income("150")], []) },
    };
    expect(getSavingsChange(entries, { year: 2026, month: 0 })).toEqual({
      kind: "up",
      percent: 50,
    });
  });

  it("has nothing to compare when the previous month has no entries", () => {
    const entries = {
      2026: { 8: month([], []), 9: month([income("100")], []) },
    };
    expect(getSavingsChange(entries, OCTOBER)).toEqual({ kind: "none" });
    expect(getSavingsChange({}, OCTOBER)).toEqual({ kind: "none" });
  });

  it("has nothing to compare when the previous month saved exactly zero", () => {
    const entries = {
      2026: {
        8: month([income("300")], [expense("300")]),
        9: month([income("100")], []),
      },
    };
    expect(getSavingsChange(entries, OCTOBER)).toEqual({ kind: "none" });
  });
});

describe("formatPercent", () => {
  it("shows one decimal", () => {
    expect(formatPercent(12.5)).toBe("12.5%");
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatPercent(999)).toBe("999.0%");
  });

  it("caps changes from 1,000% upward", () => {
    expect(formatPercent(1000)).toBe(">999%");
  });
});
