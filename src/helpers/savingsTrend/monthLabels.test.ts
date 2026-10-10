import { getMonthLabel } from "./monthLabels";

describe("getMonthLabel", () => {
  it("names a month in English", () => {
    expect(getMonthLabel(8, "en")).toBe("September");
    expect(getMonthLabel(8, "en", "sentence")).toBe("September");
    expect(getMonthLabel(8, "en", "short")).toBe("Sep");
  });

  it("names a month in Spanish: title case at a line start, lower case mid-sentence", () => {
    expect(getMonthLabel(8, "es")).toBe("Septiembre");
    expect(getMonthLabel(8, "es", "sentence")).toBe("septiembre");
    expect(getMonthLabel(8, "es", "short")).toBe("sep");
  });

  it("keeps three-letter months whole and has no trailing dot", () => {
    expect(getMonthLabel(4, "en", "short")).toBe("May");
    expect(getMonthLabel(3, "es", "short")).toBe("abr");
  });
});
