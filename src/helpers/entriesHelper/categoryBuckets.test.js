const {
  getExpenseCategoryNames,
  getEntryCategoryOption,
  getBucketValidationError,
} = require("./entriesHelper");

describe("category/bucket helpers (issue #100)", () => {
  describe("getExpenseCategoryNames", () => {
    it("returns the seed categories when no buckets are provided", () => {
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

    it("does not duplicate a bucket that matches a seed category case-insensitively", () => {
      const names = getExpenseCategoryNames({ food: 200 });
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

    it("leaves income options unaffected by buckets", () => {
      const options = getEntryCategoryOption("income", { Gym: 120 });
      expect(options).toContainEqual({ name: "Salary", value: "salary" });
      expect(options.find((option) => option.name === "Gym")).toBeUndefined();
    });
  });

  describe("getBucketValidationError", () => {
    it("rejects an empty or whitespace-only name", () => {
      expect(getBucketValidationError({ name: "", buckets: {} })).toMatch(
        /cannot be empty/i
      );
      expect(getBucketValidationError({ name: "   ", buckets: {} })).toMatch(
        /cannot be empty/i
      );
    });

    it("rejects a duplicate name regardless of case", () => {
      const error = getBucketValidationError({
        name: "food",
        buckets: { Food: 200 },
      });
      expect(error).toMatch(/already exists/i);
    });

    it("accepts a unique, non-empty name", () => {
      expect(
        getBucketValidationError({ name: "Gym", buckets: { Food: 200 } })
      ).toBeNull();
    });
  });
});
