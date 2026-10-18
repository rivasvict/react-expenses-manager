import LocalStorage from "./index";

describe("LocalStorage.applyOnboarding (new-user onboarding wizard)", () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = LocalStorage();
  });

  it("stores the chosen lists and one bucket per limit", async () => {
    const result = await storage.applyOnboarding({
      categoryLists: { expense: ["Food", "Gym"], income: ["Salary"] },
      buckets: { Food: 450, Gym: "30" },
    });

    const buckets = {
      Food: [{ from: "0000-00", limit: 450 }],
      Gym: [{ from: "0000-00", limit: 30 }],
    };
    expect(result.buckets).toEqual(buckets);
    expect(JSON.parse(localStorage.getItem("buckets"))).toEqual(buckets);
    expect(JSON.parse(localStorage.getItem("categoryLists"))).toEqual({
      expense: ["Food", "Gym"],
      income: ["Salary"],
    });
  });

  it("keeps empty lists empty instead of rebuilding the seed lists", async () => {
    await storage.applyOnboarding({
      categoryLists: { expense: [], income: [] },
      buckets: {},
    });

    expect(await storage.getCategoryLists()).toEqual({ expense: [], income: [] });
    expect(JSON.parse(localStorage.getItem("buckets"))).toEqual({});
  });

  it("replaces lists the app wrote before the wizard finished", async () => {
    localStorage.setItem(
      "categoryLists",
      JSON.stringify({ expense: ["House (Rent)"], income: ["Salary"] })
    );

    await storage.applyOnboarding({
      categoryLists: { expense: ["Gym"], income: [] },
      buckets: {},
    });

    expect(await storage.getCategoryLists()).toEqual({ expense: ["Gym"], income: [] });
  });

  it("attributes the bucket when a session names who added it", async () => {
    const result = await storage.applyOnboarding({
      categoryLists: { expense: ["Food"], income: [] },
      buckets: { Food: 10 },
      addedBy: "ana",
    });

    expect(result.buckets.Food).toEqual([
      { from: "0000-00", limit: 10, addedBy: "ana" },
    ]);
  });

  it("rejects lists that are not usable", async () => {
    await expect(
      storage.applyOnboarding({ categoryLists: { expense: "x" }, buckets: {} })
    ).rejects.toThrow(/category lists/i);
  });
});
