const {
  EXPENSE_CATEGORIES,
  getExpenseCategoryNames,
  getEntryCategoryOption,
  getUnbudgetedCategories,
  getBucketValidationError,
  getBucketAllowanceValidationError,
} = require("./entriesHelper");
const { createTranslator } = require("../../i18n/translator");

describe("category/bucket helpers (issue #100)", () => {
  describe("getExpenseCategoryNames", () => {
    it.each(EXPENSE_CATEGORIES)(
      "returns the seed category %s when no buckets or categories are provided",
      (seedCategory) => {
        expect(getExpenseCategoryNames()).toContain(seedCategory);
      }
    );

    it("appends user-created bucket names that are not seed categories", () => {
      const names = getExpenseCategoryNames({ Gym: 120, Food: 200 });
      expect(names).toContain("Gym");
      // "Food" is already a seed category, so it must not be duplicated.
      expect(names.filter((name) => name.toLowerCase() === "food")).toHaveLength(
        1
      );
    });

    it("appends standalone categories that do not have a bucket yet", () => {
      const names = getExpenseCategoryNames({ Food: 200 }, ["Gym"]);
      expect(names).toContain("Gym");
    });

    it("does not duplicate a category that matches a seed category case-insensitively", () => {
      const names = getExpenseCategoryNames({}, ["food"]);
      const foodEntries = names.filter(
        (name) => name.toLowerCase() === "food"
      );
      expect(foodEntries).toHaveLength(1);
    });
  });

  describe("getEntryCategoryOption", () => {
    const categoryLists = { expense: ["Food", "Gym"], income: ["Salary", "Gym"] };

    it("offers the user's categories of the entry's type", () => {
      expect(getEntryCategoryOption("expense", categoryLists)).toEqual([
        { name: "Food", value: "food" },
        { name: "Gym", value: "gym" },
      ]);
      expect(getEntryCategoryOption("income", categoryLists)).toEqual([
        { name: "Salary", value: "salary" },
        { name: "Gym", value: "gym" },
      ]);
    });

    it("offers nothing before the lists are loaded", () => {
      expect(getEntryCategoryOption("expense")).toEqual([]);
    });
  });

  describe("getUnbudgetedCategories", () => {
    it("lists the expense categories that do not already have a bucket", () => {
      const result = getUnbudgetedCategories({
        buckets: { food: 200 },
        categoryLists: { expense: ["Food", "Gym", "Travel"], income: ["Salary"] },
      });
      expect(result).toEqual(["Gym", "Travel"]);
    });
  });

  describe("getBucketValidationError", () => {
    it("rejects an empty selection", () => {
      expect(
        getBucketValidationError({ categoryName: "", buckets: {} })
      ).toMatch(/select a category/i);
    });

    it("rejects a category that already has a bucket, regardless of case", () => {
      const error = getBucketValidationError({
        categoryName: "food",
        buckets: { Food: 200 },
      });
      expect(error).toMatch(/already exists/i);
    });

    it("accepts a category without an existing bucket", () => {
      expect(
        getBucketValidationError({ categoryName: "Gym", buckets: { Food: 200 } })
      ).toBeNull();
    });
  });

  describe("getBucketAllowanceValidationError", () => {
    it("rejects a negative allowance", () => {
      expect(getBucketAllowanceValidationError("-100")).toMatch(/greater than zero/i);
      expect(getBucketAllowanceValidationError(-50)).toMatch(/greater than zero/i);
      expect(getBucketAllowanceValidationError("-0.01")).toMatch(/greater than zero/i);
    });

    it("rejects a zero allowance", () => {
      expect(getBucketAllowanceValidationError("0")).toMatch(/greater than zero/i);
      expect(getBucketAllowanceValidationError(0)).toMatch(/greater than zero/i);
    });

    it("rejects a non-numeric allowance", () => {
      expect(getBucketAllowanceValidationError("abc")).toMatch(/valid number/i);
      expect(getBucketAllowanceValidationError("")).toMatch(/valid number/i);
    });

    it("accepts positive allowances", () => {
      expect(getBucketAllowanceValidationError(200)).toBeNull();
      expect(getBucketAllowanceValidationError("199.99")).toBeNull();
    });
  });

  describe("validation messages in another language", () => {
    const spanish = createTranslator("es");

    it("words every message in the given translator's language", () => {
      expect(getBucketValidationError({ categoryName: "" }, spanish)).toBe(
        "Selecciona una categoría"
      );
      expect(
        getBucketValidationError(
          { categoryName: "Food", buckets: { Food: 10 } },
          spanish
        )
      ).toBe("Ya existe un límite para «Food»");
      expect(getBucketAllowanceValidationError("abc", spanish)).toBe(
        "La asignación debe ser un número válido"
      );
      expect(getBucketAllowanceValidationError(0, spanish)).toBe(
        "La asignación debe ser mayor que cero"
      );
    });
  });
});
