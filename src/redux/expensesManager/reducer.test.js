const { reducer } = require("./reducer");
const {
  ADD_BUCKET,
  ADD_CATEGORY,
  GET_CATEGORIES,
  CATEGORY_CHANGED,
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
          };

    const nextState = reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Food: 200, Gym: 120 }, categoryName: "Gym" },
    });

    expect(nextState.buckets).toEqual({ Food: 200, Gym: 120 });
  });

  it("does not mutate the previous state", () => {
    const initialState = { buckets: { Food: 200 } };

    reducer(initialState, {
      type: ADD_BUCKET,
      payload: { buckets: { Gym: 120 }, categoryName: "Gym" },
    });

    expect(initialState.buckets).toEqual({ Food: 200 });
  });
});

describe("expensesManager reducer - ADD_CATEGORY / GET_CATEGORIES (category management)", () => {
  const lists = { expense: ["Food", "Gym"], income: ["Salary"] };

  it("sets the category lists on ADD_CATEGORY", () => {
    const nextState = reducer(
      { buckets: {}, categoryLists: { expense: [], income: [] } },
      { type: ADD_CATEGORY, payload: { categoryLists: lists } }
    );

    expect(nextState.categoryLists).toEqual(lists);
  });

  it("sets the category lists on GET_CATEGORIES", () => {
    const nextState = reducer(
      { buckets: {}, categoryLists: { expense: [], income: [] } },
      { type: GET_CATEGORIES, payload: { categoryLists: lists } }
    );

    expect(nextState.categoryLists).toEqual(lists);
  });

  it("replaces entries, buckets, lists and fixed entries on CATEGORY_CHANGED", () => {
    const previous = {
      entries: { 2026: { 4: { incomes: [], expenses: [{ id: "e1" }] } } },
      buckets: { "Eating out": 400, Food: 650 },
      categoryLists: { expense: ["Eating out", "Food"], income: [] },
      fixedEntries: [{ id: "f1" }],
      entryFilters: getDefaultEntryFilters(),
    };
    const payload = {
      entries: { 2026: { 4: { incomes: [], expenses: [{ id: "e1", moved: true }] } } },
      buckets: { Food: 650 },
      categoryLists: { expense: ["Food"], income: [] },
      fixedEntries: [],
    };

    const nextState = reducer(previous, { type: CATEGORY_CHANGED, payload });

    expect(nextState.entries).toEqual(payload.entries);
    expect(nextState.buckets).toEqual({ Food: 650 });
    expect(nextState.categoryLists).toEqual(payload.categoryLists);
    expect(nextState.fixedEntries).toEqual([]);
    expect(nextState.entryFilters).toBe(previous.entryFilters);
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
