import type { Language } from "../i18n/languages";

/** One theme of the catalog (src/themes/catalog/*.json). */
export interface Theme {
  id: string;
  /** A proper name: never translated. */
  name: string;
  scheme: "dark" | "light";
  default?: boolean;
  /** What the theme is inspired by, per language. */
  inspiration: Record<Language, string>;
  description: Record<Language, string>;
  /** The headline typeface (a Google Fonts family kept in src/themes/fonts/). */
  typography?: {
    display: { family: string; file: string };
    tracking: string;
  };
  /** Name of the background picture src/themes/art/<art>.svg; none = plain. */
  art?: string;
  color: Record<string, string>;
  chart: Record<string, string>;
  shadow: Record<string, string>;
}
