import {
  getEmptyFixedEntries,
  resolveFixedAmount,
  setFixedEntryHistory,
  applyFixedEntry,
  materializeFixedEntries,
} from "./fixedEntriesHelper";

describe("fixedEntriesHelper (issue #103)", () => {
  describe("resolveFixedAmount", () => {
    it("returns null when there is no history", () => {
      expect(resolveFixedAmount(undefined, "2026-05")).toBeNull();
      expect(resolveFixedAmount([], "2026-05")).toBeNull();
    });

    it("returns the amount effective on or before the month, forward-only", () => {
      const history = [
        { from: "2026-03", amount: 100 },
        { from: "2026-06", amount: 150 },
      ];
      // Before the first change there is nothing yet.
      expect(resolveFixedAmount(history, "2026-02")).toBeNull();
      // The first change applies from March forward.
      expect(resolveFixedAmount(history, "2026-03")).toBe(100);
      expect(resolveFixedAmount(history, "2026-05")).toBe(100);
      // The second change applies from June forward, leaving earlier months at 100.
      expect(resolveFixedAmount(history, "2026-06")).toBe(150);
      expect(resolveFixedAmount(history, "2027-01")).toBe(150);
    });

    it("treats a null amount as a removal tombstone from that month forward", () => {
      const history = [
        { from: "2026-03", amount: 100 },
        { from: "2026-06", amount: null },
      ];
      expect(resolveFixedAmount(history, "2026-05")).toBe(100);
      expect(resolveFixedAmount(history, "2026-06")).toBeNull();
      expect(resolveFixedAmount(history, "2026-09")).toBeNull();
    });
  });

  describe("setFixedEntryHistory", () => {
    it("keeps a single, chronologically sorted change per month", () => {
      let history = setFixedEntryHistory([], { from: "2026-06", amount: 150 });
      history = setFixedEntryHistory(history, { from: "2026-03", amount: 100 });
      // Editing the same month replaces the value instead of duplicating it.
      history = setFixedEntryHistory(history, { from: "2026-03", amount: 120 });

      expect(history).toEqual([
        { from: "2026-03", amount: 120 },
        { from: "2026-06", amount: 150 },
      ]);
    });
  });

  describe("applyFixedEntry", () => {
    it("does not mutate the input config", () => {
      const original = getEmptyFixedEntries();
      const updated = applyFixedEntry(original, {
        type: "expense",
        category: "Food",
        from: "2026-05",
        amount: 200,
      });
      expect(original).toEqual(getEmptyFixedEntries());
      expect(updated.expense.Food).toEqual([{ from: "2026-05", amount: 200 }]);
    });
  });

  describe("materializeFixedEntries", () => {
    // Month indexes are 0-based: 2 = March (key "2026-03"), 3 = April
    // ("2026-04"), 4 = May ("2026-05").
    const baseEntries = {
      2026: {
        2: { incomes: [], expenses: [] },
        3: { incomes: [], expenses: [] },
        4: { incomes: [], expenses: [] },
      },
    };

    it("returns the tree untouched when there are no fixed entries", () => {
      const result = materializeFixedEntries({
        entries: baseEntries,
        fixedEntries: getEmptyFixedEntries(),
      });
      expect(result).toBe(baseEntries);
    });

    it("injects a fixed expense into every month from its effective month forward", () => {
      const fixedEntries = applyFixedEntry(getEmptyFixedEntries(), {
        type: "expense",
        category: "Rent",
        from: "2026-04",
        amount: 800,
      });

      const result = materializeFixedEntries({
        entries: baseEntries,
        fixedEntries,
      });

      // March (index 2, before the effective April) has nothing.
      expect(result[2026][2].expenses).toHaveLength(0);
      // April (index 3) and May (index 4) carry the fixed expense.
      expect(result[2026][3].expenses).toHaveLength(1);
      expect(result[2026][3].expenses[0]).toMatchObject({
        amount: 800,
        type: "expense",
        categories_path: ",rent,",
        isFixed: true,
      });
      expect(result[2026][4].expenses[0].amount).toBe(800);
    });

    it("produces deterministic ids and does not mutate the source tree", () => {
      const fixedEntries = applyFixedEntry(getEmptyFixedEntries(), {
        type: "income",
        category: "Salary",
        from: "2026-03",
        amount: 1000,
      });

      const result = materializeFixedEntries({
        entries: baseEntries,
        fixedEntries,
      });

      // March is month index 2, so the deterministic id ends in -2026-2.
      expect(result[2026][2].incomes[0].id).toBe("fixed-income-salary-2026-2");
      // Source tree untouched.
      expect(baseEntries[2026][2].incomes).toHaveLength(0);
    });
  });
});
