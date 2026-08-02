import LocalStorage from "./index";

describe("LocalStorage.editBucket (issue #102)", () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = LocalStorage();
  });

  it("rejects a negative limit without persisting", async () => {
    localStorage.setItem(
      "buckets",
      JSON.stringify({ Food: [{ from: "0000-00", limit: 200 }] })
    );

    await expect(
      storage.editBucket({ bucketName: "Food", limit: -50, fromYearMonth: "2026-03" })
    ).rejects.toThrow(/cannot be negative/i);

    expect(JSON.parse(localStorage.getItem("buckets"))).toEqual({
      Food: [{ from: "0000-00", limit: 200 }],
    });
  });

  it("accepts a zero limit", async () => {
    localStorage.setItem(
      "buckets",
      JSON.stringify({ Food: [{ from: "0000-00", limit: 200 }] })
    );

    const result = await storage.editBucket({
      bucketName: "Food",
      limit: 0,
      fromYearMonth: "2026-03",
    });

    expect(result.Food).toContainEqual({ from: "2026-03", limit: 0 });
  });
});
