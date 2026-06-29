import {
  getEmptyFixedEntries,
  resolveFixedEntryState,
  setHistoryState,
  addFixedEntryDefinition,
  updateFixedEntryDefinition,
  materializeFixedEntries,
} from "./fixedEntriesHelper";

const expenseState = (amount, description = "Rent") => ({
  amount,
  description,
  categories_path: ",rent,",
});

describe("fixedEntriesHelper (issue #103)", () => {
  describe("resolveFixedEntryState", () => {
    it("returns null when there is no history", () => {
      expect(resolveFixedEntryState(undefined, "2026-05")).toBeNull();
      expect(resolveFixedEntryState([], "2026-05")).toBeNull();
    });

    it("returns the state effective on or before the month, forward-only", () => {
      const history = [
        { from: "2026-03", ...expenseState(100) },
        { from: "2026-06", ...expenseState(150) },
      ];
      // Before the first state there is nothing yet.
      expect(resolveFixedEntryState(history, "2026-02")).toBeNull();
      // The first state applies from March forward.
      expect(resolveFixedEntryState(history, "2026-03").amount).toBe(100);
      expect(resolveFixedEntryState(history, "2026-05").amount).toBe(100);
      // The second state applies from June forward, leaving earlier months at 100.
      expect(resolveFixedEntryState(history, "2026-06").amount).toBe(150);
      expect(resolveFixedEntryState(history, "2027-01").amount).toBe(150);
    });

    it("treats a removal tombstone as gone from that month forward", () => {
      const history = [
        { from: "2026-03", ...expenseState(100) },
        { from: "2026-06", removed: true },
      ];
      expect(resolveFixedEntryState(history, "2026-05").amount).toBe(100);
      expect(resolveFixedEntryState(history, "2026-06")).toBeNull();
      expect(resolveFixedEntryState(history, "2026-09")).toBeNull();
    });
  });

  describe("setHistoryState", () => {
    it("keeps a single, chronologically sorted state per month", () => {
      let history = setHistoryState([], "2026-06", expenseState(150));
      history = setHistoryState(history, "2026-03", expenseState(100));
      // Editing the same month replaces the value instead of duplicating it.
      history = setHistoryState(history, "2026-03", expenseState(120));

      expect(history.map((state) => [state.from, state.amount])).toEqual([
        ["2026-03", 120],
        ["2026-06", 150],
      ]);
    });
  });

  describe("add / update definitions", () => {
    it("supports several recurring entries in the same category", () => {
      let fixedEntries = getEmptyFixedEntries();
      fixedEntries = addFixedEntryDefinition(fixedEntries, {
        id: "a",
        type: "expense",
        from: "2026-05",
        ...expenseState(200, "Groceries"),
      });
      fixedEntries = addFixedEntryDefinition(fixedEntries, {
        id: "b",
        type: "expense",
        from: "2026-05",
        ...expenseState(50, "Snacks"),
      });

      expect(fixedEntries).toHaveLength(2);
      expect(fixedEntries.map((definition) => definition.id)).toEqual(["a", "b"]);
    });

    it("applies a forward-only edit to a single definition without mutating input", () => {
      const original = addFixedEntryDefinition(getEmptyFixedEntries(), {
        id: "a",
        type: "expense",
        from: "2026-03",
        ...expenseState(200),
      });
      const updated = updateFixedEntryDefinition(original, {
        id: "a",
        from: "2026-05",
        ...expenseState(250),
      });

      // Source untouched.
      expect(original[0].history).toHaveLength(1);
      // March keeps 200, May onward becomes 250.
      expect(resolveFixedEntryState(updated[0].history, "2026-04").amount).toBe(200);
      expect(resolveFixedEntryState(updated[0].history, "2026-05").amount).toBe(250);
    });

    it("removes a definition from a month forward via a tombstone", () => {
      let fixedEntries = addFixedEntryDefinition(getEmptyFixedEntries(), {
        id: "a",
        type: "expense",
        from: "2026-03",
        ...expenseState(200),
      });
      fixedEntries = updateFixedEntryDefinition(fixedEntries, {
        id: "a",
        from: "2026-05",
        removed: true,
      });

      expect(resolveFixedEntryState(fixedEntries[0].history, "2026-04").amount).toBe(200);
      expect(resolveFixedEntryState(fixedEntries[0].history, "2026-05")).toBeNull();
    });
  });

  describe("materializeFixedEntries", () => {
    // Month indexes are 0-based: 2 = March ("2026-03"), 3 = April, 4 = May.
    const baseEntries = () => ({
      2026: {
        2: { incomes: [], expenses: [] },
        3: { incomes: [], expenses: [] },
        4: { incomes: [], expenses: [] },
      },
    });

    it("returns the tree untouched when there are no fixed entries", () => {
      const entries = baseEntries();
      expect(materializeFixedEntries({ entries, fixedEntries: [] })).toBe(entries);
    });

    it("injects two same-category entries into every month from their effective month", () => {
      const fixedEntries = [
        addFixedEntryDefinition([], {
          id: "a",
          type: "expense",
          from: "2026-03",
          ...expenseState(200, "Groceries"),
        })[0],
        addFixedEntryDefinition([], {
          id: "b",
          type: "expense",
          from: "2026-03",
          ...expenseState(50, "Snacks"),
        })[0],
      ];

      const result = materializeFixedEntries({
        entries: baseEntries(),
        fixedEntries,
      });

      // April (index 3) carries both same-category recurring expenses.
      expect(result[2026][3].expenses).toHaveLength(2);
      expect(result[2026][3].expenses.map((e) => e.description).sort()).toEqual([
        "Groceries",
        "Snacks",
      ]);
      // The synthetic ids are deterministic and flagged for the edit screen.
      expect(result[2026][3].expenses[0]).toMatchObject({
        id: "fixed-a",
        fixedId: "a",
        isFixed: true,
        type: "expense",
        categories_path: ",rent,",
      });
    });

    it("does not mutate the source tree", () => {
      const entries = baseEntries();
      const fixedEntries = addFixedEntryDefinition([], {
        id: "a",
        type: "income",
        from: "2026-03",
        amount: 1000,
        description: "Salary",
        categories_path: ",salary,",
      });
      materializeFixedEntries({ entries, fixedEntries });
      expect(entries[2026][2].incomes).toHaveLength(0);
    });
  });
});
