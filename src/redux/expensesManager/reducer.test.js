const { reducer } = require("./reducer");
const { ADD_BUCKET, ADD_CATEGORY, GET_CATEGORIES } = require("./actions");

describe("expensesManager reducer - ADD_BUCKET (issue #100)", () => {
  it("merges a newly created bucket into the existing buckets", () => {
    const initialState = {
      buckets: { Food: 200 },
      categories: [],
    };

    const nextState = reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Food: 200, Gym: 120 }, categoryName: "Gym" },
    });

    expect(nextState.buckets).toEqual({ Food: 200, Gym: 120 });
  });

  it("does not mutate the previous state", () => {
    const initialState = { buckets: { Food: 200 }, categories: [] };

    reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Gym: 120 }, categoryName: "Gym" },
    });

    expect(initialState.buckets).toEqual({ Food: 200 });
  });

  it("removes the newly bucketed category from the standalone categories list", () => {
    const initialState = { buckets: { Food: 200 }, categories: ["Gym", "Yoga"] };

    const nextState = reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Food: 200, Gym: 120 }, categoryName: "Gym" },
    });

    expect(nextState.categories).toEqual(["Yoga"]);
  });
});

describe("expensesManager reducer - ADD_CATEGORY / GET_CATEGORIES (issue #100)", () => {
  it("sets the standalone categories list on ADD_CATEGORY", () => {
    const initialState = { buckets: {}, categories: [] };

    const nextState = reducer(initialState, {
      type: ADD_CATEGORY,
      payload: { categories: ["Gym"] },
    });

    expect(nextState.categories).toEqual(["Gym"]);
  });

  it("sets the standalone categories list on GET_CATEGORIES", () => {
    const initialState = { buckets: {}, categories: [] };

    const nextState = reducer(initialState, {
      type: GET_CATEGORIES,
      payload: { categories: ["Gym", "Yoga"] },
    });

    expect(nextState.categories).toEqual(["Gym", "Yoga"]);
  });
});
