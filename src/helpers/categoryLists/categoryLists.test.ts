import {
  buildCategoryListsFromLegacy,
  categoryPathOf,
  categorySegmentOf,
  findCategoryName,
  getCategoryNameError,
  isCategoryLists,
  pathMatchesCategory,
  sortCategoryNames,
  withCategoriesFromData,
} from "./categoryLists";
import { createTranslator } from "../../i18n/translator";

describe("category paths", () => {
  it("writes and reads the `,name,` format in lower case", () => {
    expect(categoryPathOf(" Eating Out ")).toBe(",eating out,");
    expect(categorySegmentOf(",eating out,")).toBe("eating out");
    expect(categorySegmentOf("")).toBe("");
  });

  it("matches a path to a category case-insensitively", () => {
    expect(pathMatchesCategory(",eating out,", "Eating Out")).toBe(true);
    expect(pathMatchesCategory(",food,", "Eating out")).toBe(false);
    expect(pathMatchesCategory("", "")).toBe(false);
  });

  it("finds a name ignoring case and surrounding spaces", () => {
    expect(findCategoryName(["Food", "Gym"], " gym ")).toBe("Gym");
    expect(findCategoryName(["Food"], "Gym")).toBeUndefined();
  });
});

describe("buildCategoryListsFromLegacy (the categoryLists migration)", () => {
  it("starts a fresh install from the seed categories", () => {
    const lists = buildCategoryListsFromLegacy({});
    expect(lists.income).toEqual(["Salary", "Deposit", "Saving"]);
    expect(lists.expense).toContain("Eating out");
    expect(lists.expense).toContain("House (Rent)");
  });

  it("adds the old unbudgeted categories and the bucket names, without duplicates", () => {
    const lists = buildCategoryListsFromLegacy({
      categories: ["Gym", "food"],
      buckets: { Pets: [{ from: "0000-00", limit: 50 }], FOOD: 200 },
    });
    expect(lists.expense).toContain("Gym");
    expect(lists.expense).toContain("Pets");
    expect(lists.expense.filter((name) => name.toLowerCase() === "food")).toHaveLength(1);
  });

  it("adds every category the entries and fixed entries use, capitalised, to its own type", () => {
    const lists = buildCategoryListsFromLegacy({
      balance: [
        { type: "expense", categories_path: ",yoga classes," },
        { type: "income", categories_path: ",lottery," },
        { type: "income", categories_path: ",salary," },
      ],
      fixedEntries: [
        {
          type: "expense",
          history: [{ from: "2026-01", categories_path: ",pet care," }],
        },
      ],
    });
    expect(lists.expense).toContain("Yoga classes");
    expect(lists.expense).toContain("Pet care");
    expect(lists.income).toEqual(["Salary", "Deposit", "Saving", "Lottery"]);
  });

  it("ignores a legacy empty-array buckets value", () => {
    expect(() => buildCategoryListsFromLegacy({ buckets: [] })).not.toThrow();
  });
});

describe("withCategoriesFromData", () => {
  it("never removes or renames a listed category", () => {
    const lists = { expense: ["Travel"], income: [] };
    expect(withCategoriesFromData(lists, {})).toEqual(lists);
  });

  it("lists the categories that synced entries and buckets bring", () => {
    expect(
      withCategoriesFromData(
        { expense: ["Food"], income: [] },
        {
          balance: [{ type: "income", categories_path: ",bonus," }],
          buckets: { Gym: 10 },
        }
      )
    ).toEqual({ expense: ["Food", "Gym"], income: ["Bonus"] });
  });
});

describe("isCategoryLists", () => {
  it("accepts two string lists and nothing else", () => {
    expect(isCategoryLists({ expense: [], income: ["Salary"] })).toBe(true);
    expect(isCategoryLists({ expense: [] })).toBe(false);
    expect(isCategoryLists({ expense: [1], income: [] })).toBe(false);
    expect(isCategoryLists(null)).toBe(false);
  });
});

describe("sortCategoryNames", () => {
  it("sorts alphabetically in the UI language without touching the input", () => {
    const names = ["travel", "Eating out", "Ánimo", "food"];
    expect(sortCategoryNames(names, "es")).toEqual([
      "Ánimo",
      "Eating out",
      "food",
      "travel",
    ]);
    expect(names[0]).toBe("travel");
  });
});

describe("getCategoryNameError", () => {
  const categoryLists = { expense: ["Food", "Eating out"], income: ["Salary"] };

  it("rejects an empty or blank name", () => {
    expect(
      getCategoryNameError({ name: "  ", type: "expense", categoryLists })
    ).toBe("Category name cannot be empty");
  });

  it("rejects a name another category of the same type uses", () => {
    expect(
      getCategoryNameError({ name: " food ", type: "expense", categoryLists })
    ).toBe("An expense category called “food” already exists.");
    expect(
      getCategoryNameError({ name: "salary", type: "income", categoryLists })
    ).toBe("An income category called “salary” already exists.");
  });

  it("allows the same name in the other type", () => {
    expect(
      getCategoryNameError({ name: "Food", type: "income", categoryLists })
    ).toBeNull();
  });

  it("lets a category keep its own name or change only its case", () => {
    expect(
      getCategoryNameError({
        name: "EATING OUT",
        type: "expense",
        categoryLists,
        currentName: "Eating out",
      })
    ).toBeNull();
  });

  it("words the message in the translator's language", () => {
    expect(
      getCategoryNameError(
        { name: "Food", type: "expense", categoryLists },
        createTranslator("es")
      )
    ).toBe("Ya existe una categoría de gasto llamada «Food».");
  });
});
