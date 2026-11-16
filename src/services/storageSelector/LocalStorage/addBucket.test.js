import LocalStorage from "./index";

// The month the bucket is added in; it is recorded from there on.
const MAY = "2026-05";

describe("LocalStorage.addBucket (issue #100)", () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = LocalStorage();
  });

  it("adds a brand new bucket and persists it", async () => {
    localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));

    const result = await storage.addBucket({ bucket: { Gym: 120 }, fromYearMonth: MAY });

    expect(result).toEqual({
      Food: 200,
      Gym: [{ from: MAY, limit: 120 }],
    });
    expect(JSON.parse(localStorage.getItem("buckets"))).toEqual({
      Food: 200,
      Gym: [{ from: MAY, limit: 120 }],
    });
  });

  it("starts the bucket in the month it is added, not from the beginning", async () => {
    const result = await storage.addBucket({
      bucket: { Gym: 120 },
      fromYearMonth: "2026-11",
    });
    expect(result.Gym).toEqual([{ from: "2026-11", limit: 120 }]);
  });

  it("rejects a bucket without a valid start month, without persisting", async () => {
    await expect(
      storage.addBucket({ bucket: { Gym: 120 } })
    ).rejects.toThrow(/month the bucket starts/i);
    await expect(
      storage.addBucket({ bucket: { Gym: 120 }, fromYearMonth: "2026-13" })
    ).rejects.toThrow(/month the bucket starts/i);
    expect(JSON.parse(localStorage.getItem("buckets") || "{}")).toEqual({});
  });

  it("trims the name and coerces the allowance to a number", async () => {
    const result = await storage.addBucket({ bucket: { "  Gym  ": "120" }, fromYearMonth: MAY });
    expect(result).toEqual({ Gym: [{ from: MAY, limit: 120 }] });
  });

  it("rejects a duplicate name (case-insensitive) without persisting", async () => {
    localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));

    await expect(
      storage.addBucket({ bucket: { food: 50 }, fromYearMonth: MAY })
    ).rejects.toThrow(/already exists/i);

    expect(JSON.parse(localStorage.getItem("buckets"))).toEqual({ Food: 200 });
  });

  it("rejects an empty name", async () => {
    await expect(
      storage.addBucket({ bucket: { "   ": 50 }, fromYearMonth: MAY })
    ).rejects.toThrow(/cannot be empty/i);
  });

  it("rejects a negative allowance without persisting", async () => {
    await expect(
      storage.addBucket({ bucket: { Gym: -50 }, fromYearMonth: MAY })
    ).rejects.toThrow(/greater than zero/i);
    expect(JSON.parse(localStorage.getItem("buckets") || "{}")).toEqual({});
  });

  it("rejects a zero allowance without persisting", async () => {
    await expect(
      storage.addBucket({ bucket: { Gym: 0 }, fromYearMonth: MAY })
    ).rejects.toThrow(/greater than zero/i);
    expect(JSON.parse(localStorage.getItem("buckets") || "{}")).toEqual({});
  });

  // Category management: a category keeps its place in `categoryLists` when
  // it gets a bucket, and the old `categories` key is no longer written.
  it("leaves the category lists and the old categories key untouched", async () => {
    const lists = { expense: ["Gym", "Yoga"], income: ["Salary"] };
    localStorage.setItem("categoryLists", JSON.stringify(lists));
    localStorage.setItem("categories", JSON.stringify(["Gym", "Yoga"]));

    await storage.addBucket({ bucket: { Gym: 120 }, fromYearMonth: MAY });

    expect(JSON.parse(localStorage.getItem("categoryLists"))).toEqual(lists);
    expect(JSON.parse(localStorage.getItem("categories"))).toEqual([
      "Gym",
      "Yoga",
    ]);
  });
});
