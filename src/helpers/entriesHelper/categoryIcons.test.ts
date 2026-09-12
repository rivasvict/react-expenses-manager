import { getCategoryGlyph } from "./categoryIcons";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./entriesHelper";
import { GLYPHS } from "../../components/common/GlyphIcon";

const SEED_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

describe("category → icon map", () => {
  it("resolves every seed category to a glyph that exists in the set", () => {
    SEED_CATEGORIES.forEach((category) => {
      const glyph = getCategoryGlyph(category);
      expect(glyph).not.toBeNull();
      // The resolved name must be a real glyph, not a dangling key.
      expect(Object.prototype.hasOwnProperty.call(GLYPHS, glyph as string)).toBe(
        true
      );
    });
  });

  it("is case-insensitive, matching the bucket-name normalization", () => {
    expect(getCategoryGlyph("EATING OUT")).toBe(getCategoryGlyph("eating out"));
    expect(getCategoryGlyph("  Food  ")).toBe(getCategoryGlyph("food"));
  });

  it("falls back to null for unknown / user-created categories", () => {
    expect(getCategoryGlyph("Totally custom category")).toBeNull();
    expect(getCategoryGlyph("")).toBeNull();
    expect(getCategoryGlyph(undefined)).toBeNull();
  });
});
