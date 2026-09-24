/**
 * The languages the UI can be rendered in. English is the default and the
 * source of truth for every translation key (see ./translations/en.ts).
 */
export const SUPPORTED_LANGUAGES = ["en", "es"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

/**
 * Each language's name in that language. Shown untranslated in the picker,
 * so a reader can always find their own language whatever the UI is set to.
 */
export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Español",
};

export const isSupportedLanguage = (value: unknown): value is Language =>
  typeof value === "string" &&
  (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
