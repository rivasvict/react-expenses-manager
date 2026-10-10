import {
  getDefaultRange,
  getPresetMonthsBack,
  getRecordedMonths,
  getReferenceMonth,
  resolveRange,
  getSavingsTrend,
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

describe("resolveRange", () => {
  const entries = thirteenMonths();
  const preset = (id: "1M" | "6M" | "1Y" | "YTD") => ({ kind: "preset" as const, id });
  const fourMonths: EntriesTree = { 2026: { 6: empty, 7: empty, 8: empty, 9: empty } };

  it("is ready, reaching as far back as the range says, when the history allows", () => {
    expect(resolveRange(entries, OCTOBER_2026, preset("1M"))).toEqual({ status: "ready", monthsBack: 1 });
    expect(resolveRange(entries, OCTOBER_2026, preset("6M"))).toEqual({ status: "ready", monthsBack: 6 });
    expect(resolveRange(entries, OCTOBER_2026, preset("1Y"))).toEqual({ status: "ready", monthsBack: 12 });
    expect(resolveRange(entries, OCTOBER_2026, preset("YTD"))).toEqual({ status: "ready", monthsBack: 9 });
  });

  it("is short, with the first recorded month, when the range reaches before it", () => {
    const earliest = { year: 2026, month: 6 };
    expect(resolveRange(fourMonths, OCTOBER_2026, preset("6M"))).toEqual({ status: "short", monthsBack: 3, earliest });
    expect(resolveRange(fourMonths, OCTOBER_2026, preset("1Y"))).toEqual({ status: "short", monthsBack: 3, earliest });
    expect(resolveRange(fourMonths, OCTOBER_2026, preset("YTD"))).toEqual({ status: "short", monthsBack: 3, earliest });
    expect(resolveRange(fourMonths, OCTOBER_2026, { kind: "custom", monthsBack: 5 })).toEqual({ status: "short", monthsBack: 3, earliest });
  });

  it("is ready for a range that exactly reaches the first recorded month", () => {
    expect(resolveRange(fourMonths, OCTOBER_2026, { kind: "custom", monthsBack: 3 })).toEqual({ status: "ready", monthsBack: 3 });
  });

  it("re-evaluates as the end month moves back through the history", () => {
    expect(resolveRange(entries, { year: 2026, month: 2 }, preset("1Y"))).toMatchObject({ status: "short", monthsBack: 5 });
    expect(resolveRange(entries, { year: 2026, month: 2 }, preset("6M"))).toMatchObject({ status: "short", monthsBack: 5 });
  });

  it("compares January with the month before for YTD, like 1M", () => {
    expect(resolveRange(entries, { year: 2026, month: 0 }, preset("YTD"))).toEqual({ status: "ready", monthsBack: 1 });
  });

  it("is empty when no earlier month is recorded", () => {
    expect(resolveRange({ 2026: { 9: empty } }, OCTOBER_2026, preset("6M"))).toEqual({ status: "empty" });
    expect(resolveRange(entries, { year: 2025, month: 9 }, preset("1M"))).toEqual({ status: "empty" });
    expect(resolveRange({}, OCTOBER_2026, { kind: "custom", monthsBack: 3 })).toEqual({ status: "empty" });
  });
});

describe("getDefaultRange", () => {
  it("is 6M when the history reaches six months back", () => {
    expect(getDefaultRange(thirteenMonths(), OCTOBER_2026)).toEqual({ kind: "preset", id: "6M" });
  });

  it("is the longest preset the history reaches when it does not reach 6M", () => {
    const fourMonths: EntriesTree = { 2026: { 6: empty, 7: empty, 8: empty, 9: empty } };
    expect(getDefaultRange(fourMonths, OCTOBER_2026)).toEqual({ kind: "preset", id: "3M" });
    const twoMonths: EntriesTree = { 2026: { 8: empty, 9: empty } };
    expect(getDefaultRange(twoMonths, OCTOBER_2026)).toEqual({ kind: "preset", id: "1M" });
  });

  it("falls back to 6M when there is nothing earlier at all", () => {
    expect(getDefaultRange({ 2026: { 9: empty } }, OCTOBER_2026)).toEqual({ kind: "preset", id: "6M" });
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
