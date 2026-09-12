import type { GlyphName } from "../../components/common/GlyphIcon";

/**
 * Maps a category to the glyph shown inside its entry-row chip (candidate 1 of
 * the visual refresh). Keyed by the lowercased category name — the same
 * normalization buckets already use — so a lookup is case-insensitive.
 *
 * The map covers every seed category from `entriesHelper.js`
 * (INCOME_CATEGORIES + EXPENSE_CATEGORIES). Any category not listed here —
 * i.e. one the user created themselves — resolves to `null`, and the caller
 * falls back to today's money-direction arrow, so custom categories degrade to
 * exactly the current behavior rather than a broken chip.
 */
const CATEGORY_ICON_MAP: Record<string, GlyphName> = {
  // Home
  "house (rent)": "home",
  "house stuff": "home",
  "insurance house": "home",
  // Car / transport
  car: "car",
  "car parking": "car",
  "car insurance": "car",
  gas: "car",
  "car expenses": "car",
  transportation: "bus",
  // Food & drink
  food: "cart",
  "eating out": "coffee",
  alcohol: "wine",
  // Utilities & services
  hydro: "zap",
  internet: "wifi",
  "mobile phone plan": "phone",
  subscriptions: "repeat",
  "bank fees": "bank",
  laundry: "shirt",
  // Life
  donation: "gift",
  "fun activities": "ticket",
  travel: "plane",
  sports: "dumbbell",
  beauty: "sparkle",
  unexpected: "alert",
  "person 1 bucket": "user",
  "person 2 bucket": "user",
  education: "book",
  health: "health",
  "baby stuff": "bottle",
  // Income
  salary: "briefcase",
  deposit: "deposit",
  saving: "vault",
};

/**
 * Returns the glyph name for a category, or `null` when the category has no
 * mapping (custom user categories) so the caller can fall back to the arrow.
 */
export const getCategoryGlyph = (category?: string): GlyphName | null => {
  if (!category) return null;
  return CATEGORY_ICON_MAP[category.trim().toLowerCase()] ?? null;
};

export { CATEGORY_ICON_MAP };
