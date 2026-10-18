import {
  addOwnCategory,
  chosenNamesOf,
  clearCategories,
  createWizardDraft,
  getBucketCount,
  getBucketErrors,
  getBucketsTotal,
  isBucketTicked,
  isSelected,
  selectAllCategories,
  SEED_CATEGORIES,
  setBucketLimit,
  toggleBucket,
  toggleCategory,
  toOnboardingResult,
} from "./wizardDraft";

const emptyDraft = () => createWizardDraft({ currency: "USD", privacyMode: false });

describe("wizardDraft", () => {
  it("starts with nothing chosen", () => {
    const draft = emptyDraft();
    expect(chosenNamesOf(draft, "expense")).toEqual([]);
    expect(chosenNamesOf(draft, "income")).toEqual([]);
    expect(toOnboardingResult(draft)).toEqual({
      categoryLists: { expense: [], income: [] },
      buckets: {},
    });
  });

  it("toggles a seed category and lists chosen seeds in seed order", () => {
    let draft = toggleCategory(emptyDraft(), "expense", "Food");
    draft = toggleCategory(draft, "expense", "Transportation");
    expect(chosenNamesOf(draft, "expense")).toEqual(["Transportation", "Food"]);
    draft = toggleCategory(draft, "expense", "Food");
    expect(chosenNamesOf(draft, "expense")).toEqual(["Transportation"]);
  });

  it("keeps the expense and income lists independent", () => {
    const draft = toggleCategory(emptyDraft(), "income", "Salary");
    expect(chosenNamesOf(draft, "income")).toEqual(["Salary"]);
    expect(chosenNamesOf(draft, "expense")).toEqual([]);
  });

  it("selects all seeds (keeping own names) and clears everything", () => {
    let draft = addOwnCategory(emptyDraft(), "expense", "Pet food").draft;
    draft = selectAllCategories(draft, "expense");
    expect(chosenNamesOf(draft, "expense")).toEqual([
      ...SEED_CATEGORIES.expense,
      "Pet food",
    ]);
    draft = clearCategories(draft, "expense");
    expect(chosenNamesOf(draft, "expense")).toEqual([]);
  });

  it("adds an own category as chosen, trimmed", () => {
    const { draft, error } = addOwnCategory(emptyDraft(), "income", "  Freelance ");
    expect(error).toBeNull();
    expect(chosenNamesOf(draft, "income")).toEqual(["Freelance"]);
    expect(isSelected(draft, "income", "Freelance")).toBe(true);
  });

  it("rejects an empty name and a duplicate of a seed or an own name, ignoring case", () => {
    const empty = addOwnCategory(emptyDraft(), "expense", "   ");
    expect(empty.error).toBe("Category name cannot be empty");

    const seedClash = addOwnCategory(emptyDraft(), "expense", "food");
    expect(seedClash.error).toBe("An expense category called “food” already exists.");
    expect(chosenNamesOf(seedClash.draft, "expense")).toEqual([]);

    const first = addOwnCategory(emptyDraft(), "income", "Freelance").draft;
    const ownClash = addOwnCategory(first, "income", "FREELANCE");
    expect(ownClash.error).toBe("An income category called “FREELANCE” already exists.");
  });

  it("allows the same name once in each type", () => {
    const first = addOwnCategory(emptyDraft(), "expense", "Gifts").draft;
    expect(addOwnCategory(first, "income", "Gifts").error).toBeNull();
  });

  it("removes an own category by toggling its chip", () => {
    const draft = addOwnCategory(emptyDraft(), "expense", "Pet food").draft;
    expect(chosenNamesOf(toggleCategory(draft, "expense", "Pet food"), "expense")).toEqual([]);
  });

  describe("buckets", () => {
    const withCategories = () =>
      ["Food", "Eating out"].reduce(
        (draft, name) => toggleCategory(draft, "expense", name),
        emptyDraft()
      );

    it("typing a limit ticks the row and clearing it unticks it", () => {
      let draft = setBucketLimit(withCategories(), "Food", "450");
      expect(isBucketTicked(draft, "Food")).toBe(true);
      draft = setBucketLimit(draft, "Food", "");
      expect(isBucketTicked(draft, "Food")).toBe(false);
    });

    it("ticking a row leaves its limit empty and unticking removes it", () => {
      let draft = toggleBucket(withCategories(), "Food");
      expect(draft.buckets).toEqual({ Food: "" });
      draft = toggleBucket(draft, "Food");
      expect(draft.buckets).toEqual({});
    });

    it("reports an error for a ticked row whose limit is empty, invalid or zero", () => {
      let draft = toggleBucket(withCategories(), "Food");
      draft = setBucketLimit(draft, "Eating out", "0");
      expect(getBucketErrors(draft)).toEqual({
        Food: "Allowance must be a valid number",
        "Eating out": "Allowance must be greater than zero",
      });
    });

    it("saves only valid limits as numbers and totals them", () => {
      let draft = setBucketLimit(withCategories(), "Food", "450.50");
      draft = setBucketLimit(draft, "Eating out", "300");
      expect(getBucketsTotal(draft)).toBe(750.5);
      expect(getBucketCount(draft)).toBe(2);
      expect(toOnboardingResult(draft).buckets).toEqual({
        Food: 450.5,
        "Eating out": 300,
      });
    });

    it("counts only the buckets that have a valid limit", () => {
      let draft = setBucketLimit(withCategories(), "Food", "450");
      draft = setBucketLimit(draft, "Eating out", "0");
      expect(getBucketCount(draft)).toBe(1);
      expect(getBucketsTotal(draft)).toBe(450);
    });

    it("drops the limit of a category that is no longer chosen", () => {
      let draft = setBucketLimit(withCategories(), "Food", "450");
      draft = toggleCategory(draft, "expense", "Food");
      expect(draft.buckets).toEqual({});
    });

    it("drops every limit when the expense categories are cleared", () => {
      let draft = setBucketLimit(withCategories(), "Food", "450");
      draft = clearCategories(draft, "expense");
      expect(toOnboardingResult(draft).buckets).toEqual({});
    });
  });
});
