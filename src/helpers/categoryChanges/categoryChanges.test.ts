import {
  CategoryChange,
  applyCategoryChange,
  getAffectedEntries,
  getEntriesInCategory,
  isCategoryChange,
} from "./categoryChanges";

const entry = (id: string, path: string, overrides: any = {}) => ({
  id,
  type: "expense",
  amount: "10",
  description: `Entry ${id}`,
  date: 1790000000000,
  categories_path: path,
  ...overrides,
});

const data = () => ({
  balance: [
    entry("e1", ",eating out,"),
    entry("e2", ",eating out,"),
    entry("e3", ",food,"),
    entry("i1", ",eating out,", { type: "income" }),
  ],
  fixedEntries: [
    {
      id: "f1",
      type: "expense",
      history: [
        { from: "2026-01", amount: "5", description: "Lunch plan", categories_path: ",eating out," },
        { from: "2026-03", removed: true },
      ],
    },
  ],
  buckets: {
    "Eating out": [{ from: "0000-00", limit: 400 }],
    Food: [{ from: "0000-00", limit: 650 }],
  },
  categoryLists: {
    expense: ["Eating out", "Food", "Travel"],
    income: ["Eating out"],
  },
});

const rename: CategoryChange = {
  id: "c1",
  kind: "rename",
  type: "expense",
  name: "Eating out",
  newName: "Restaurants",
  at: 1,
};

describe("getEntriesInCategory", () => {
  it("lists the entries then the fixed entries of that type and category", () => {
    const listed = getEntriesInCategory(data(), "expense", "eating OUT");
    expect(listed.map((item) => [item.id, item.fixed])).toEqual([
      ["e1", false],
      ["e2", false],
      ["f1", true],
    ]);
    expect(listed[2].description).toBe("Lunch plan");
  });
});

describe("applyCategoryChange — rename", () => {
  it("moves every entry and fixed state of that type, the list and the bucket", () => {
    const original = data();
    const next = applyCategoryChange(original, rename);

    expect(next.balance.map((item) => item.categories_path)).toEqual([
      ",restaurants,",
      ",restaurants,",
      ",food,",
      ",eating out,", // an income of the same name is untouched
    ]);
    expect(next.fixedEntries[0].history[0].categories_path).toBe(",restaurants,");
    expect(next.fixedEntries[0].history[1]).toEqual({ from: "2026-03", removed: true });
    expect(next.categoryLists!.expense).toEqual(["Restaurants", "Food", "Travel"]);
    expect(next.categoryLists!.income).toEqual(["Eating out"]);
    expect(next.buckets).toEqual({
      Food: [{ from: "0000-00", limit: 650 }],
      Restaurants: [{ from: "0000-00", limit: 400 }],
    });
    // Never mutates its input.
    expect(original.balance[0].categories_path).toBe(",eating out,");
  });

  it("relabels a case-only rename", () => {
    const next = applyCategoryChange(data(), { ...rename, newName: "Eating Out" });
    expect(next.categoryLists!.expense[0]).toBe("Eating Out");
    expect(Object.keys(next.buckets)).toContain("Eating Out");
    expect(next.balance[0].categories_path).toBe(",eating out,");
  });

  it("merges into a category of the new name that already exists", () => {
    const next = applyCategoryChange(data(), { ...rename, newName: "food" });
    expect(next.categoryLists!.expense).toEqual(["Food", "Travel"]);
    expect(next.buckets).toEqual({ Food: [{ from: "0000-00", limit: 650 }] });
  });

  it("adds the new name when the device does not list the old one", () => {
    const next = applyCategoryChange(
      { ...data(), categoryLists: { expense: ["Food"], income: [] } },
      rename
    );
    expect(next.categoryLists!.expense).toEqual(["Food", "Restaurants"]);
  });
});

describe("applyCategoryChange — delete", () => {
  const remove: CategoryChange = {
    id: "c2",
    kind: "delete",
    type: "expense",
    name: "Eating out",
    moves: { e1: "Food", e2: "Travel", f1: "Food" },
    fallback: "Food",
    at: 2,
  };

  it("moves each entry where it was sent and removes the category and its bucket", () => {
    const next = applyCategoryChange(data(), remove);
    expect(next.balance.map((item) => item.categories_path)).toEqual([
      ",food,",
      ",travel,",
      ",food,",
      ",eating out,",
    ]);
    expect(next.fixedEntries[0].history[0].categories_path).toBe(",food,");
    expect(next.categoryLists!.expense).toEqual(["Food", "Travel"]);
    expect(Object.keys(next.buckets)).toEqual(["Food"]);
  });

  it("sends entries the change does not list to its fallback", () => {
    const withUnknown = { ...data(), balance: [...data().balance, entry("e9", ",eating out,")] };
    const next = applyCategoryChange(withUnknown, remove);
    expect(next.balance[4].categories_path).toBe(",food,");
  });

  it("keeps the category listed while an entry still has nowhere to go", () => {
    const next = applyCategoryChange(
      { ...data(), balance: [entry("e9", ",eating out,")], fixedEntries: [] },
      { ...remove, moves: {}, fallback: undefined }
    );
    expect(next.balance[0].categories_path).toBe(",eating out,");
    expect(next.categoryLists!.expense).toContain("Eating out");
  });

  it("names where each affected entry goes", () => {
    expect(
      getAffectedEntries(data(), remove).map((item) => [item.id, item.target])
    ).toEqual([
      ["e1", "Food"],
      ["e2", "Travel"],
      ["f1", "Food"],
    ]);
  });
});

describe("isCategoryChange", () => {
  it("accepts well-formed changes only", () => {
    expect(isCategoryChange(rename)).toBe(true);
    expect(isCategoryChange({ ...rename, newName: undefined })).toBe(false);
    expect(isCategoryChange({ ...rename, type: "other" })).toBe(false);
    expect(isCategoryChange(null)).toBe(false);
  });
});
