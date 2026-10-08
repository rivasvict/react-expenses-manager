import { getEntryAddedDate } from "./entryAddedDate";
import { createTranslator } from "../../i18n";

// Noon local time, so the formatted day never shifts with the test's timezone.
const OCTOBER_8_2026 = new Date(2026, 9, 8, 12).getTime();

describe("getEntryAddedDate", () => {
  it("formats the stamp with the English date format by default", () => {
    expect(getEntryAddedDate(OCTOBER_8_2026)).toBe("Oct 8, 2026");
  });

  it("formats the stamp in the given language", () => {
    expect(getEntryAddedDate(OCTOBER_8_2026, createTranslator("es"))).toBe(
      "8 oct 2026"
    );
  });

  it("returns null for entries saved without a stamp", () => {
    expect(getEntryAddedDate(undefined)).toBeNull();
    expect(getEntryAddedDate(null)).toBeNull();
    expect(getEntryAddedDate("")).toBeNull();
    expect(getEntryAddedDate("1770000000000")).toBeNull();
    expect(getEntryAddedDate(Number.NaN)).toBeNull();
  });
});
