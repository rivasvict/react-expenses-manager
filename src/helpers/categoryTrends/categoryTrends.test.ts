import {
  categoryTrendPath,
  formatWholePercent,
  getCategoryTrend,
  getRankedCategoryTrends,
  getTone,
  hasEntriesInRange,
} from "./categoryTrends";
import type { EntriesTree } from "../savingsChange/savingsChange";

const expense = (amount: number, path: string) => ({
  amount: String(amount),
  type: "expense",
  categories_path: path,
});
const income = (amount: number, path: string) => ({
  amount: String(amount),
  type: "income",
  categories_path: path,
});

// April (3) to June (5) 2026.
const ENTRIES: EntriesTree = {
  2026: {
    3: {
      expenses: [expense(300, ",eating out,"), expense(80, ",eating out,"), expense(700, ",food,")],
      incomes: [income(200, ",freelance,")],
    },
    4: { expenses: [expense(420, ",eating out,"), expense(650, ",food,")], incomes: [] },
    5: {
      expenses: [expense(540, ",eating out,"), expense(610, ",food,"), expense(30, ",gym,")],
      incomes: [income(650, ",freelance,")],
    },
  },
};
const JUNE = { year: 2026, month: 5 };

describe("getCategoryTrend", () => {
  it("adds up a category's entries month by month, as positive amounts", () => {
    const trend = getCategoryTrend(ENTRIES, "expense", "Eating out", JUNE, 2);
    expect(trend.points.map((point) => point.amount)).toEqual([380, 420, 540]);
    expect(trend.total).toBe(1340);
    expect(trend.months).toBe(3);
    expect(trend.average).toBeCloseTo(446.67, 2);
  });

  it("compares the end month with the reference month", () => {
    const trend = getCategoryTrend(ENTRIES, "expense", "Eating out", JUNE, 2);
    expect(trend.difference).toBe(160);
    expect(trend.change).toEqual({ kind: "up", percent: 42.1 });
    expect(trend.tone).toBe("bad");
  });

  it("reads more earned as good news for an income category", () => {
    const trend = getCategoryTrend(ENTRIES, "income", "Freelance", JUNE, 2);
    expect(trend.change).toEqual({ kind: "up", percent: 225 });
    expect(trend.tone).toBe("good");
  });

  it("has no percentage when the reference month had nothing", () => {
    const trend = getCategoryTrend(ENTRIES, "expense", "Gym", JUNE, 2);
    expect(trend.change).toEqual({ kind: "new" });
    expect(trend.points[0].hasEntries).toBe(false);
  });

  it("matches the category whatever its case", () => {
    expect(getCategoryTrend(ENTRIES, "expense", "FOOD", JUNE, 0).end.amount).toBe(610);
  });

  it("is flat for a category that stayed at nothing", () => {
    const trend = getCategoryTrend(ENTRIES, "expense", "Travel", JUNE, 2);
    expect(trend.change).toEqual({ kind: "flat", percent: 0 });
    expect(trend.tone).toBe("flat");
    expect(hasEntriesInRange(trend)).toBe(false);
  });
});

describe("getRankedCategoryTrends", () => {
  it("lists the categories with entries, the biggest change first", () => {
    const ranked = getRankedCategoryTrends(
      ENTRIES,
      { expense: ["Eating out", "Food", "Gym", "Travel"], income: [] },
      "expense",
      JUNE,
      2
    );
    // Gym is new (no percentage), Eating out +42.1%, Food −12.9%; Travel has nothing.
    expect(ranked.map((trend) => trend.name)).toEqual(["Gym", "Eating out", "Food"]);
  });

  it("breaks a tie by the size of the amount change", () => {
    const entries: EntriesTree = {
      2026: {
        4: { expenses: [expense(100, ",a,"), expense(10, ",b,")] },
        5: { expenses: [expense(150, ",a,"), expense(15, ",b,")] },
      },
    };
    const ranked = getRankedCategoryTrends(entries, { expense: ["B", "A"], income: [] }, "expense", JUNE, 1);
    expect(ranked.map((trend) => trend.name)).toEqual(["A", "B"]);
  });
});

describe("getTone", () => {
  it("reads less spent and more earned as good", () => {
    expect(getTone("expense", -10)).toBe("good");
    expect(getTone("expense", 10)).toBe("bad");
    expect(getTone("income", 10)).toBe("good");
    expect(getTone("income", -10)).toBe("bad");
    expect(getTone("income", 0)).toBe("flat");
  });
});

describe("formatWholePercent", () => {
  it("rounds to a whole percentage and caps very large ones", () => {
    expect(formatWholePercent(42.1)).toBe("42%");
    expect(formatWholePercent(2.5)).toBe("3%");
    expect(formatWholePercent(1000)).toBe(">999%");
  });
});

describe("categoryTrendPath", () => {
  it("encodes the category name", () => {
    expect(categoryTrendPath("expense", "Eating out")).toBe("/category-trends/expense/Eating%20out");
  });
});
