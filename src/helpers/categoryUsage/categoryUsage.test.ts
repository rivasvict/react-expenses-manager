import { getCategoryUsage, getSavedEntries } from "./categoryUsage";

const tree = {
  2026: {
    8: {
      incomes: [{ id: "i1", type: "income", amount: 100, categories_path: ",salary," }],
      expenses: [
        { id: "e1", type: "expense", amount: 9.75, categories_path: ",eating out,", date: 1 },
        { id: "fixed-f1", fixedId: "f1", isFixed: true, type: "expense", amount: "5", categories_path: ",eating out," },
      ],
    },
    9: {
      incomes: [],
      expenses: [
        { id: "e2", type: "expense", amount: "64.50", categories_path: ",eating out,", date: 2 },
        { id: "fixed-f1", fixedId: "f1", isFixed: true, type: "expense", amount: "5", categories_path: ",eating out," },
      ],
    },
  },
};

const fixedEntries = [
  {
    id: "f1",
    type: "expense",
    history: [{ from: "2026-09", amount: "5", description: "Lunch plan", categories_path: ",eating out," }],
  },
];

describe("getSavedEntries", () => {
  it("reads the saved entries back from the tree, without the materialized fixed ones", () => {
    expect(getSavedEntries(tree).map((entry) => entry.id)).toEqual(["i1", "e1", "e2"]);
  });
});

describe("getCategoryUsage", () => {
  it("counts entries and fixed entries once, and totals every month's amounts", () => {
    const usage = getCategoryUsage({ entries: tree, fixedEntries }, "expense", "Eating out");
    expect(usage.count).toBe(3);
    expect(usage.total).toBeCloseTo(84.25);
    expect(usage.entries.map((entry) => entry.id)).toEqual(["e1", "e2", "f1"]);
  });

  it("is empty for an unused category or the other type", () => {
    expect(getCategoryUsage({ entries: tree }, "expense", "Travel")).toEqual({
      count: 0,
      total: 0,
      entries: [],
    });
    expect(getCategoryUsage({ entries: tree }, "income", "Eating out").count).toBe(0);
  });
});
