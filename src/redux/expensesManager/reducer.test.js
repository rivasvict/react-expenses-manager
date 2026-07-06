const { reducer } = require("./reducer");
const { ADD_BUCKET, ADD_CATEGORY, GET_CATEGORIES } = require("./actions");

describe("expensesManager reducer - ADD_BUCKET (issue #100)", () => {
  it("merges a newly created bucket into the existing buckets", () => {
    const initialState = {
      buckets: { Food: 200 },
      unbudgetedCategories: [],
    };

    const nextState = reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Food: 200, Gym: 120 }, categoryName: "Gym" },
    });

    expect(nextState.buckets).toEqual({ Food: 200, Gym: 120 });
  });

  it("does not mutate the previous state", () => {
    const initialState = { buckets: { Food: 200 }, unbudgetedCategories: [] };

    reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Gym: 120 }, categoryName: "Gym" },
    });

    expect(initialState.buckets).toEqual({ Food: 200 });
  });

  it("removes the newly bucketed category from the unbudgeted categories list", () => {
    const initialState = {
      buckets: { Food: 200 },
      unbudgetedCategories: ["Gym", "Yoga"],
    };

    const nextState = reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Food: 200, Gym: 120 }, categoryName: "Gym" },
    });

    expect(nextState.unbudgetedCategories).toEqual(["Yoga"]);
  });
});

describe("expensesManager reducer - ADD_CATEGORY / GET_CATEGORIES (issue #100)", () => {
  it("sets the unbudgeted categories list on ADD_CATEGORY", () => {
    const initialState = { buckets: {}, unbudgetedCategories: [] };

    const nextState = reducer(initialState, {
      type: ADD_CATEGORY,
      payload: { unbudgetedCategories: ["Gym"] },
    });

    expect(nextState.unbudgetedCategories).toEqual(["Gym"]);
  });

  it("sets the unbudgeted categories list on GET_CATEGORIES", () => {
    const initialState = { buckets: {}, unbudgetedCategories: [] };

    const nextState = reducer(initialState, {
      type: GET_CATEGORIES,
      payload: { unbudgetedCategories: ["Gym", "Yoga"] },
    });

    expect(nextState.unbudgetedCategories).toEqual(["Gym", "Yoga"]);
  });
});
