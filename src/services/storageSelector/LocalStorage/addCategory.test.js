import LocalStorage from "./index";

describe("LocalStorage.addCategory (issue #100)", () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = LocalStorage();
  });

  it("adds a brand new standalone category and persists it", async () => {
    const result = await storage.addCategory({ category: "Gym" });

    expect(result).toEqual(["Gym"]);
    expect(JSON.parse(localStorage.getItem("categories"))).toEqual(["Gym"]);
  });

  it("trims the category name", async () => {
    const result = await storage.addCategory({ category: "  Gym  " });
    expect(result).toEqual(["Gym"]);
  });

  it("rejects a duplicate category name (case-insensitive) without persisting", async () => {
    localStorage.setItem("categories", JSON.stringify(["Gym"]));

    await expect(
      storage.addCategory({ category: "gym" })
    ).rejects.toThrow(/already exists/i);

    expect(JSON.parse(localStorage.getItem("categories"))).toEqual(["Gym"]);
  });

  it("rejects a name that already exists as a bucket", async () => {
    localStorage.setItem("buckets", JSON.stringify({ Food: 200 }));

    await expect(
      storage.addCategory({ category: "food" })
    ).rejects.toThrow(/already exists/i);
  });

  it("rejects an empty name", async () => {
    await expect(
      storage.addCategory({ category: "   " })
    ).rejects.toThrow(/cannot be empty/i);
  });

  it("getCategories returns an empty list when nothing was stored", async () => {
    const result = await storage.getCategories();
    expect(result).toEqual([]);
  });
});
