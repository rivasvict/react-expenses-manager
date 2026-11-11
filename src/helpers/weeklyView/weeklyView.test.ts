import {
  DEFAULT_WEEKLY_VIEW,
  getStoredWeeklyView,
  isWeeklyView,
  storeWeeklyView,
  WEEKLY_VIEW_STORAGE_KEY,
} from "./weeklyView";

beforeEach(() => localStorage.clear());

describe("getStoredWeeklyView", () => {
  it("is the week rows when nothing is stored", () => {
    expect(DEFAULT_WEEKLY_VIEW).toBe("rows");
    expect(getStoredWeeklyView()).toBe("rows");
  });

  it("returns what was stored", () => {
    storeWeeklyView("bars");
    expect(getStoredWeeklyView()).toBe("bars");
    storeWeeklyView("line");
    expect(getStoredWeeklyView()).toBe("line");
  });

  it("falls back to the default for an unknown value", () => {
    localStorage.setItem(WEEKLY_VIEW_STORAGE_KEY, "pie");
    expect(getStoredWeeklyView()).toBe("rows");
  });

  it("falls back to the default when storage cannot be read", () => {
    const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getStoredWeeklyView()).toBe("rows");
    spy.mockRestore();
  });
});

describe("isWeeklyView", () => {
  it("accepts only the three views", () => {
    expect(["rows", "bars", "line"].every(isWeeklyView)).toBe(true);
    expect(isWeeklyView("pie")).toBe(false);
    expect(isWeeklyView(null)).toBe(false);
  });
});
