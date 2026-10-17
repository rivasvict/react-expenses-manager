import LocalStorage from "./index";

// Category lists (category management,
// design/features/category-management/ui/decision.md).
describe("LocalStorage category lists", () => {
  let storage;

  beforeEach(() => {
    localStorage.clear();
    storage = LocalStorage();
  });

  const storedLists = () => JSON.parse(localStorage.getItem("categoryLists"));

  describe("addCategory", () => {
    beforeEach(() => {
      localStorage.setItem(
        "categoryLists",
        JSON.stringify({ expense: ["Food"], income: ["Salary"] })
      );
    });

    it("adds a trimmed category to its type's list and persists it", async () => {
      const result = await storage.addCategory({ type: "expense", name: "  Gym  " });

      expect(result).toEqual({ expense: ["Food", "Gym"], income: ["Salary"] });
      expect(storedLists()).toEqual(result);
    });

    it("rejects a duplicate within the type (case-insensitive) without persisting", async () => {
      await expect(
        storage.addCategory({ type: "expense", name: "food" })
      ).rejects.toThrow(/already exists/i);
      expect(storedLists()).toEqual({ expense: ["Food"], income: ["Salary"] });
    });

    it("allows the same name once in each type", async () => {
      const result = await storage.addCategory({ type: "income", name: "Food" });
      expect(result.income).toEqual(["Salary", "Food"]);
    });

    it("rejects an empty name and a missing type", async () => {
      await expect(
        storage.addCategory({ type: "expense", name: "   " })
      ).rejects.toThrow(/cannot be empty/i);
      await expect(storage.addCategory({ name: "Gym" })).rejects.toThrow(
        /type is required/i
      );
    });
  });

  describe("getCategoryLists (migration)", () => {
    it("builds the lists once from the seeds, old categories, buckets and entries", async () => {
      localStorage.setItem("categories", JSON.stringify(["Gym"]));
      localStorage.setItem("buckets", JSON.stringify({ Pets: 50 }));
      localStorage.setItem(
        "balance",
        JSON.stringify([
          { id: "e1", type: "expense", categories_path: ",yoga classes,", amount: "1" },
          { id: "i1", type: "income", categories_path: ",lottery,", amount: "1" },
        ])
      );

      const lists = await storage.getCategoryLists();

      expect(lists.expense).toEqual(
        expect.arrayContaining(["Food", "Gym", "Pets", "Yoga classes"])
      );
      expect(lists.income).toEqual(["Salary", "Deposit", "Saving", "Lottery"]);
      expect(storedLists()).toEqual(lists);
      // Existing data is not rewritten.
      expect(JSON.parse(localStorage.getItem("categories"))).toEqual(["Gym"]);
    });

    it("returns the stored lists once they exist", async () => {
      const lists = { expense: [], income: ["Salary"] };
      localStorage.setItem("categoryLists", JSON.stringify(lists));

      expect(await storage.getCategoryLists()).toEqual(lists);
    });
  });

  describe("applyCategoryChange", () => {
    beforeEach(() => {
      localStorage.setItem(
        "categoryLists",
        JSON.stringify({ expense: ["Eating out", "Food"], income: ["Salary"] })
      );
      localStorage.setItem(
        "buckets",
        JSON.stringify({ "Eating out": [{ from: "0000-00", limit: 400 }] })
      );
      localStorage.setItem(
        "balance",
        JSON.stringify([
          { id: "e1", type: "expense", categories_path: ",eating out,", amount: "9" },
          { id: "e2", type: "expense", categories_path: ",food,", amount: "5" },
        ])
      );
    });

    it("renames the category in entries, the list and the bucket, and logs the change", async () => {
      const change = {
        id: "c1",
        kind: "rename",
        type: "expense",
        name: "Eating out",
        newName: "Restaurants",
        at: 1,
      };

      await storage.applyCategoryChange({ change });

      expect(storedLists().expense).toEqual(["Restaurants", "Food"]);
      expect(JSON.parse(localStorage.getItem("balance"))[0].categories_path).toBe(
        ",restaurants,"
      );
      expect(Object.keys(JSON.parse(localStorage.getItem("buckets")))).toEqual([
        "Restaurants",
      ]);
      expect(JSON.parse(localStorage.getItem("categoryChanges"))).toEqual([change]);
    });

    it("rejects a malformed change", async () => {
      await expect(
        storage.applyCategoryChange({ change: { kind: "rename" } })
      ).rejects.toThrow(/invalid/i);
    });
  });

  describe("backups", () => {
    it("exports the lists and the change log, and restores lists from an old backup", async () => {
      await storage.importData({
        balance: [{ id: "e1", type: "expense", categories_path: ",gifts,", amount: "1" }],
        buckets: {},
        categories: ["Hobby"],
        fixedEntries: [],
      });

      const exported = await storage.exportData();

      expect(exported.categoryLists.expense).toEqual(
        expect.arrayContaining(["Hobby", "Gifts", "Food"])
      );
      expect(exported.categoryChanges).toEqual([]);
      expect(localStorage.getItem("categories")).toBeNull();
    });
  });
});
