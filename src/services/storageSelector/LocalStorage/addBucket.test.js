import LocalStorage from "./index";

describe("LocalStorage.addBucket (issue #100)", () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = LocalStorage();
  });

  it("adds a brand new bucket and persists it", async () => {
    localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));

    const result = await storage.addBucket({ bucket: { Gym: 120 } });

    expect(result).toEqual({
      Food: 200,
      Gym: [{ from: "0000-00", limit: 120 }],
    });
    expect(JSON.parse(localStorage.getItem("buckets"))).toEqual({
      Food: 200,
      Gym: [{ from: "0000-00", limit: 120 }],
    });
  });

  it("trims the name and coerces the allowance to a number", async () => {
    const result = await storage.addBucket({ bucket: { "  Gym  ": "120" } });
    expect(result).toEqual({ Gym: [{ from: "0000-00", limit: 120 }] });
  });

  it("rejects a duplicate name (case-insensitive) without persisting", async () => {
    localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));

    await expect(
      storage.addBucket({ bucket: { food: 50 } })
    ).rejects.toThrow(/already exists/i);

    expect(JSON.parse(localStorage.getItem("buckets"))).toEqual({ Food: 200 });
  });

  it("rejects an empty name", async () => {
    await expect(
      storage.addBucket({ bucket: { "   ": 50 } })
    ).rejects.toThrow(/cannot be empty/i);
  });

  it("removes the category from the standalone categories list once it gets a bucket", async () => {
    localStorage.setItem("categories", JSON.stringify(["Gym", "Yoga"]));

    await storage.addBucket({ bucket: { Gym: 120 } });

    expect(JSON.parse(localStorage.getItem("categories"))).toEqual(["Yoga"]);
  });
});
