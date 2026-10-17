import { formatDayMonth, formatShortDate } from "./shortDate";

const october12 = new Date("2026-10-12T12:00:00").getTime();
const september28 = new Date("2026-09-28T12:00:00").getTime();

describe("formatShortDate", () => {
  it("spells a date the way each language does", () => {
    expect(formatShortDate(october12, "en")).toBe("Oct 12, 2026");
    expect(formatShortDate(october12, "es")).toBe("12 oct 2026");
    expect(formatShortDate(september28, "es")).toBe("28 sept 2026");
  });
});

describe("formatDayMonth", () => {
  it("leaves the year out", () => {
    expect(formatDayMonth(october12, "en")).toBe("Oct 12");
    expect(formatDayMonth(october12, "es")).toBe("12 oct");
  });
});

describe("an invalid date", () => {
  it("formats as nothing", () => {
    expect(formatShortDate(Number.NaN, "en")).toBe("");
    expect(formatDayMonth(Number.NaN, "en")).toBe("");
  });
});
