import { getMonthAvailability } from "./monthAvailability";

describe("getMonthAvailability", () => {
  const entries = {
    2026: { 9: { incomes: [], expenses: [] } },
    2025: { 2: { incomes: [], expenses: [] }, 3: { incomes: [], expenses: [] } },
  };

  it("lists the years with data, oldest first", () => {
    expect(getMonthAvailability(entries, 2026).years).toEqual([2025, 2026]);
  });

  it("adds the selected year when it has no data", () => {
    expect(getMonthAvailability(entries, 2027).years).toEqual([2025, 2026, 2027]);
  });

  it("reports only the months that exist in the entries", () => {
    const { hasMonth } = getMonthAvailability(entries, 2026);
    expect(hasMonth(2025, 2)).toBe(true);
    expect(hasMonth(2025, 0)).toBe(false);
    expect(hasMonth(2024, 5)).toBe(false);
  });
});
