const { reducer } = require("./reducer");
const {
  ADD_BUCKET,
  ADD_CATEGORY,
  GET_CATEGORIES,
  SET_ENTRY_FILTERS,
  CLEAR_ENTRY_FILTERS,
  GET_ENTRY_FILTERS,
} = require("./actions");
const {
  getDefaultEntryFilters,
} = require("../../helpers/entriesHelper/filterSortHelper");

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

describe("expensesManager reducer - entry filters (filters & sorting)", () => {
  it("starts with the default entry filters", () => {
    const state = reducer(undefined, { type: "@@INIT" });

    expect(state.entryFilters).toEqual(getDefaultEntryFilters());
  });

  it("shallow-merges a partial update on SET_ENTRY_FILTERS", () => {
    const initialState = { entryFilters: getDefaultEntryFilters() };

    const nextState = reducer(initialState, {
      type: SET_ENTRY_FILTERS,
      payload: { search: "coffee", sortKey: "amount" },
    });

    expect(nextState.entryFilters).toEqual({
      search: "coffee",
      searchScope: "all",
      category: "",
      sortKey: "amount",
    });
  });

  it("does not mutate the previous state on SET_ENTRY_FILTERS", () => {
    const initialState = { entryFilters: getDefaultEntryFilters() };

    reducer(initialState, {
      type: SET_ENTRY_FILTERS,
      payload: { search: "coffee" },
    });

    expect(initialState.entryFilters).toEqual(getDefaultEntryFilters());
  });

  it("resets filters AND sort key to the defaults on CLEAR_ENTRY_FILTERS", () => {
    const initialState = {
      entryFilters: {
        search: "coffee",
        searchScope: "description",
        category: ",food,",
        sortKey: "amount",
      },
    };

    const nextState = reducer(initialState, { type: CLEAR_ENTRY_FILTERS });

    expect(nextState.entryFilters).toEqual(getDefaultEntryFilters());
  });

  it("replaces the filters wholesale on GET_ENTRY_FILTERS (hydration)", () => {
    const initialState = { entryFilters: getDefaultEntryFilters() };
    const persistedFilters = {
      search: "rent",
      searchScope: "all",
      category: ",house (rent),",
      sortKey: "name",
    };

    const nextState = reducer(initialState, {
      type: GET_ENTRY_FILTERS,
      payload: { entryFilters: persistedFilters },
    });

    expect(nextState.entryFilters).toEqual(persistedFilters);
  });
});
