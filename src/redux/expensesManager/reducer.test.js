const { reducer } = require("./reducer");
const { ADD_BUCKET } = require("./actions");

describe("expensesManager reducer - ADD_BUCKET (issue #100)", () => {
  it("merges a newly created bucket into the existing buckets", () => {
    const initialState = {
      buckets: { Food: 200 },
    };

    const nextState = reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Food: 200, Gym: 120 } },
    });

    expect(nextState.buckets).toEqual({ Food: 200, Gym: 120 });
  });

  it("does not mutate the previous state", () => {
    const initialState = { buckets: { Food: 200 } };

    reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Gym: 120 } },
    });

    expect(initialState.buckets).toEqual({ Food: 200 });
  });
});
