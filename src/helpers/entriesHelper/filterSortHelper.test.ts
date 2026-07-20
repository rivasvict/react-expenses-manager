import {
  filterEntries,
  getActiveFilterDescriptors,
  getDefaultEntryFilters,
  sortEntries,
} from "./filterSortHelper";

const entry = (overrides: Record<string, unknown> = {}) => ({
  amount: "10",
  description: "",
  date: 1000,
  categories_path: ",food,",
  ...overrides,
});

describe("filterSortHelper - filterEntries", () => {
  const coffee = entry({ description: "Coffee beans", categories_path: ",food," });
  const latte = entry({ description: "Morning latte", categories_path: ",eating out," });
  const rent = entry({ description: "Monthly rent", categories_path: ",house (rent)," });

  it("returns every entry when no search and no category are set", () => {
    expect(filterEntries({ entries: [coffee, latte, rent] })).toEqual([
      coffee,
      latte,
      rent,
    ]);
  });

  it("returns an empty list for an empty input list", () => {
    expect(filterEntries({ entries: [], search: "cof" })).toEqual([]);
  });

  it("matches the description case-insensitively as a substring", () => {
    expect(
      filterEntries({ entries: [coffee, latte, rent], search: "COFFEE" })
    ).toEqual([coffee]);
  });

  it('matches the category name in the default "all" scope', () => {
    expect(
      filterEntries({ entries: [coffee, latte, rent], search: "eating" })
    ).toEqual([latte]);
  });

  it('does not match the category name in the "description" scope', () => {
    expect(
      filterEntries({
        entries: [coffee, latte, rent],
        search: "eating",
        searchScope: "description",
      })
    ).toEqual([]);
  });

  it('still matches the description in the "description" scope', () => {
    expect(
      filterEntries({
        entries: [coffee, latte, rent],
        search: "latte",
        searchScope: "description",
      })
    ).toEqual([latte]);
  });

  it("ignores surrounding whitespace in the search term", () => {
    expect(
      filterEntries({ entries: [coffee, latte, rent], search: "  latte  " })
    ).toEqual([latte]);
  });

  it("tolerates entries without a description", () => {
    const bare = entry({ description: undefined });
    expect(filterEntries({ entries: [bare], search: "anything" })).toEqual([]);
    expect(filterEntries({ entries: [bare], search: "food" })).toEqual([bare]);
    expect(
      filterEntries({ entries: [bare], search: "food", searchScope: "description" })
    ).toEqual([]);
  });

  it("filters by category literally, including regex-special names", () => {
    expect(
      filterEntries({
        entries: [coffee, latte, rent],
        category: ",house (rent),",
      })
    ).toEqual([rent]);
  });

  it("combines category and search criteria", () => {
    const dinner = entry({ description: "Team dinner", categories_path: ",eating out," });
    expect(
      filterEntries({
        entries: [coffee, latte, dinner],
        category: ",eating out,",
        search: "dinner",
      })
    ).toEqual([dinner]);
  });
});

describe("filterSortHelper - sortEntries", () => {
  it("sorts by date, newest first", () => {
    const oldest = entry({ date: 100 });
    const newest = entry({ date: 300 });
    const middle = entry({ date: 200 });

    expect(sortEntries([oldest, newest, middle], "date")).toEqual([
      newest,
      middle,
      oldest,
    ]);
  });

  it("sorts numeric string dates too", () => {
    const oldest = entry({ date: "100" });
    const newest = entry({ date: "300" });

    expect(sortEntries([oldest, newest], "date")).toEqual([newest, oldest]);
  });

  it("sorts by absolute amount, highest first", () => {
    const small = entry({ amount: "9.99" });
    const big = entry({ amount: "800" });
    const negative = entry({ amount: "-50" });

    expect(sortEntries([small, negative, big], "amount")).toEqual([
      big,
      negative,
      small,
    ]);
  });

  it("sorts by category name A→Z, tie-broken by description", () => {
    const foodB = entry({ categories_path: ",food,", description: "Bananas" });
    const foodA = entry({ categories_path: ",food,", description: "apples" });
    const eatingOut = entry({ categories_path: ",eating out,", description: "Zebra cafe" });
    const transport = entry({ categories_path: ",transportation,", description: "Bus" });

    expect(sortEntries([transport, foodB, foodA, eatingOut], "name")).toEqual([
      eatingOut,
      foodA,
      foodB,
      transport,
    ]);
  });

  it("compares names case-insensitively", () => {
    const upper = entry({ categories_path: ",food,", description: "APPLES" });
    const lower = entry({ categories_path: ",eating out,", description: "zebra" });

    expect(sortEntries([upper, lower], "name")).toEqual([lower, upper]);
  });

  it("never mutates the input array", () => {
    const first = entry({ date: 100 });
    const second = entry({ date: 200 });
    const input = [first, second];

    const sorted = sortEntries(input, "date");

    expect(input).toEqual([first, second]);
    expect(sorted).not.toBe(input);
  });

  it("handles an empty list", () => {
    expect(sortEntries([], "amount")).toEqual([]);
  });
});

describe("filterSortHelper - getActiveFilterDescriptors", () => {
  it("returns no descriptors for the default filters", () => {
    expect(
      getActiveFilterDescriptors({ entryFilters: getDefaultEntryFilters() })
    ).toEqual([]);
  });

  it("describes the search term quoted", () => {
    expect(
      getActiveFilterDescriptors({
        entryFilters: { ...getDefaultEntryFilters(), search: "coffee" },
      })
    ).toEqual([{ key: "search", label: '"coffee"' }]);
  });

  it("describes the category with a capitalized display name", () => {
    expect(
      getActiveFilterDescriptors({
        entryFilters: { ...getDefaultEntryFilters(), category: ",eating out," },
      })
    ).toEqual([{ key: "category", label: "Category: Eating out" }]);
  });

  it("describes a non-default search scope", () => {
    expect(
      getActiveFilterDescriptors({
        entryFilters: { ...getDefaultEntryFilters(), searchScope: "description" },
      })
    ).toEqual([{ key: "searchScope", label: "Description only" }]);
  });

  it("lists every active filter, search first", () => {
    expect(
      getActiveFilterDescriptors({
        entryFilters: {
          search: "cof",
          searchScope: "description",
          category: ",food,",
          sortKey: "amount",
        },
      })
    ).toEqual([
      { key: "search", label: '"cof"' },
      { key: "category", label: "Category: Food" },
      { key: "searchScope", label: "Description only" },
    ]);
  });

  it("ignores a whitespace-only search term", () => {
    expect(
      getActiveFilterDescriptors({
        entryFilters: { ...getDefaultEntryFilters(), search: "   " },
      })
    ).toEqual([]);
  });
});
