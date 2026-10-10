import {
  getAvailablePresets,
  getPresetMonthsBack,
  getRecordedMonths,
  getReferenceMonth,
  getSavingsTrend,
  resolveRange,
} from "./savingsTrend";
import type { EntriesTree } from "../savingsChange/savingsChange";

const income = (amount: string) => ({ amount, type: "income" });
const expense = (amount: string) => ({ amount, type: "expense" });
const month = (incomes: object[], expenses: object[]) => ({ incomes, expenses });
const empty = month([], []);

const OCTOBER_2026 = { year: 2026, month: 9 };

// Oct 2025 .. Oct 2026, every month recorded; month i saves SAVINGS[i].
const SAVINGS = [820, 640, 210, -180, 480, 920, 1280, 760, 1050, 1390, 1180, 1440, 1620];
const thirteenMonths = (): EntriesTree => {
  const tree: EntriesTree = {};
  SAVINGS.forEach((savings, i) => {
    const index = 9 + i;
    const year = 2025 + Math.floor(index / 12);
    tree[year] = tree[year] || {};
    tree[year]![index % 12] = month(
      [income("4000")],
      [expense(String(4000 - savings))]
    );
  });
  return tree;
};

describe("getPresetMonthsBack", () => {
  it("counts fixed presets in months and YTD back to January", () => {
    expect(getPresetMonthsBack("1M", OCTOBER_2026)).toBe(1);
    expect(getPresetMonthsBack("6M", OCTOBER_2026)).toBe(6);
    expect(getPresetMonthsBack("1Y", OCTOBER_2026)).toBe(12);
    expect(getPresetMonthsBack("YTD", OCTOBER_2026)).toBe(9);
    expect(getPresetMonthsBack("YTD", { year: 2026, month: 0 })).toBe(0);
  });
});

describe("getRecordedMonths", () => {
  it("lists the months of the entries tree oldest first", () => {
    const entries: EntriesTree = {
      2026: { 1: empty, 0: empty },
      2025: { 11: empty },
    };
    expect(getRecordedMonths(entries)).toEqual([
      { year: 2025, month: 11 },
      { year: 2026, month: 0 },
      { year: 2026, month: 1 },
    ]);
  });

  it("is empty for an empty tree", () => {
    expect(getRecordedMonths({})).toEqual([]);
  });
});

describe("getAvailablePresets", () => {
  it("enables every preset whose reference month was recorded", () => {
    expect(getAvailablePresets(thirteenMonths(), OCTOBER_2026)).toEqual({
      "1M": true,
      "2M": true,
      "3M": true,
      "6M": true,
      "1Y": true,
      YTD: true,
    });
  });

  it("disables presets that reach before the first recorded month", () => {
    const entries: EntriesTree = {
      2026: { 6: empty, 7: empty, 8: empty, 9: empty },
    };
    expect(getAvailablePresets(entries, OCTOBER_2026)).toEqual({
      "1M": true,
      "2M": true,
      "3M": true,
      "6M": false,
      "1Y": false,
      YTD: false,
    });
  });

  it("disables YTD in January, with nothing earlier in the year", () => {
    const available = getAvailablePresets(thirteenMonths(), {
      year: 2026,
      month: 0,
    });
    expect(available.YTD).toBe(false);
    expect(available["1M"]).toBe(true);
  });

  it("disables everything at the first recorded month", () => {
    const available = getAvailablePresets(thirteenMonths(), {
      year: 2025,
      month: 9,
    });
    expect(Object.values(available).every((isOn) => !isOn)).toBe(true);
  });
});

describe("resolveRange", () => {
  const entries = thirteenMonths();

  it("keeps an available preset", () => {
    expect(
      resolveRange(entries, OCTOBER_2026, { kind: "preset", id: "1Y" })
    ).toEqual({ range: { kind: "preset", id: "1Y" }, monthsBack: 12 });
  });

  it("falls back to 6M when the asked preset is not available", () => {
    expect(
      resolveRange(entries, { year: 2026, month: 0 }, { kind: "preset", id: "YTD" })
    ).toEqual({ range: { kind: "preset", id: "3M" }, monthsBack: 3 });
  });

  it("falls back to the longest available preset when 6M is not available", () => {
    const shortHistory: EntriesTree = { 2026: { 7: empty, 8: empty, 9: empty } };
    expect(
      resolveRange(shortHistory, OCTOBER_2026, { kind: "preset", id: "1Y" })
    ).toEqual({ range: { kind: "preset", id: "2M" }, monthsBack: 2 });
  });

  it("keeps a custom span but clamps it to the recorded history", () => {
    expect(
      resolveRange(entries, OCTOBER_2026, { kind: "custom", monthsBack: 7 })
    ).toEqual({ range: { kind: "custom", monthsBack: 7 }, monthsBack: 7 });
    expect(
      resolveRange(entries, { year: 2026, month: 2 }, { kind: "custom", monthsBack: 20 })
    ).toEqual({ range: { kind: "custom", monthsBack: 5 }, monthsBack: 5 });
  });

  it("is null when no earlier month is recorded", () => {
    expect(
      resolveRange({ 2026: { 9: empty } }, OCTOBER_2026, { kind: "preset", id: "6M" })
    ).toBeNull();
    expect(
      resolveRange({}, OCTOBER_2026, { kind: "custom", monthsBack: 3 })
    ).toBeNull();
  });
});

describe("getSavingsTrend", () => {
  it("lists each month from the reference month to the end month", () => {
    const trend = getSavingsTrend(thirteenMonths(), OCTOBER_2026, 6);
    expect(trend.points.map((point) => point.savings)).toEqual([
      1280, 760, 1050, 1390, 1180, 1440, 1620,
    ]);
    expect(trend.reference).toMatchObject({ year: 2026, month: 3, savings: 1280 });
    expect(trend.end).toMatchObject({ year: 2026, month: 9, savings: 1620 });
  });

  it("reports the amount and percentage the end month moved by", () => {
    const trend = getSavingsTrend(thirteenMonths(), OCTOBER_2026, 6);
    expect(trend.difference).toBe(340);
    expect(trend.change).toEqual({ kind: "up", percent: 26.6 });
  });

  it("reports a drop below the reference month", () => {
    const trend = getSavingsTrend(thirteenMonths(), { year: 2026, month: 4 }, 1);
    expect(trend.difference).toBe(-520);
    expect(trend.change).toEqual({ kind: "down", percent: 40.6 });
  });

  it("crosses the year boundary", () => {
    const trend = getSavingsTrend(thirteenMonths(), OCTOBER_2026, 12);
    expect(trend.reference).toMatchObject({ year: 2025, month: 9 });
    expect(trend.points).toHaveLength(13);
    expect(trend.change).toEqual({ kind: "up", percent: 97.6 });
  });

  it("keeps the amount but has no percentage when the reference month has no entries", () => {
    const entries: EntriesTree = {
      2026: { 7: empty, 8: month([income("100")], []), 9: month([income("250")], []) },
    };
    const trend = getSavingsTrend(entries, OCTOBER_2026, 2);
    expect(trend.reference.hasEntries).toBe(false);
    expect(trend.difference).toBe(250);
    expect(trend.change).toEqual({ kind: "none" });
  });

  it("is a single step for 1M", () => {
    expect(getSavingsTrend(thirteenMonths(), OCTOBER_2026, 1).points).toHaveLength(2);
  });
});

describe("getReferenceMonth", () => {
  it("steps back across a year boundary", () => {
    expect(getReferenceMonth({ year: 2026, month: 1 }, 3)).toEqual({
      year: 2025,
      month: 10,
    });
  });
});
