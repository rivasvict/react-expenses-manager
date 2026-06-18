const {
  getExpenseCategoryNames,
  getEntryCategoryOption,
  getCategoryValidationError,
  getCategoriesWithoutBucket,
  getBucketValidationError,
} = require("./entriesHelper");

describe("category/bucket helpers (issue #100)", () => {
  describe("getExpenseCategoryNames", () => {
    it("returns the seed categories when no buckets or categories are provided", () => {
      const names = getExpenseCategoryNames();
      expect(names).toContain("Food");
      expect(names).toContain("Eating out");
    });

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
    it("exposes new buckets as selectable expense options", () => {
      const options = getEntryCategoryOption("expense", { Gym: 120 });
      expect(options).toContainEqual({ name: "Gym", value: "gym" });
    });

    it("exposes new standalone categories as selectable expense options", () => {
      const options = getEntryCategoryOption("expense", {}, ["Gym"]);
      expect(options).toContainEqual({ name: "Gym", value: "gym" });
    });

    it("leaves income options unaffected by buckets and categories", () => {
      const options = getEntryCategoryOption("income", { Gym: 120 }, ["Yoga"]);
      expect(options).toContainEqual({ name: "Salary", value: "salary" });
      expect(options.find((option) => option.name === "Gym")).toBeUndefined();
      expect(options.find((option) => option.name === "Yoga")).toBeUndefined();
    });
  });

  describe("getCategoryValidationError", () => {
    it("rejects an empty or whitespace-only name", () => {
      expect(
        getCategoryValidationError({ name: "", buckets: {}, categories: [] })
      ).toMatch(/cannot be empty/i);
      expect(
        getCategoryValidationError({ name: "   ", buckets: {}, categories: [] })
      ).toMatch(/cannot be empty/i);
    });

    it("rejects a name that already exists as a bucket, regardless of case", () => {
      const error = getCategoryValidationError({
        name: "food",
        buckets: { Food: 200 },
        categories: [],
      });
      expect(error).toMatch(/already exists/i);
    });

    it("rejects a name that already exists as a standalone category", () => {
      const error = getCategoryValidationError({
        name: "gym",
        buckets: {},
        categories: ["Gym"],
      });
      expect(error).toMatch(/already exists/i);
    });

    it("accepts a unique, non-empty name", () => {
      expect(
        getCategoryValidationError({
          name: "Gym",
          buckets: { Food: 200 },
          categories: [],
        })
      ).toBeNull();
    });
  });

  describe("getCategoriesWithoutBucket", () => {
    it("returns standalone categories that do not already have a bucket", () => {
      const result = getCategoriesWithoutBucket({
        buckets: { Food: 200 },
        categories: ["Gym", "Food"],
      });
      expect(result).toEqual(["Gym"]);
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
});
