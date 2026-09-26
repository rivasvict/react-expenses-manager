import { DEFAULT_LANGUAGE, Language } from "./languages";
import en, { TranslationKey } from "./translations/en";
import es from "./translations/es";

export type TranslationParams = Record<string, string | number>;

/** Base keys that have both a `_one` and an `_other` form. */
export type PluralKey = {
  [Key in TranslationKey]: Key extends `${infer Base}_other`
    ? `${Base}_one` extends TranslationKey
      ? Base
      : never
    : never;
}[TranslationKey];

export type Translator = {
  language: Language;
  /** The text for `key`, with `{{param}}` placeholders filled in. */
  t: (key: TranslationKey, params?: TranslationParams) => string;
  /**
   * Picks `<key>_one` or `<key>_other` for `count` by the language's plural
   * rules; `{{count}}` is always available as a placeholder.
   */
  plural: (key: PluralKey, count: number, params?: TranslationParams) => string;
};

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = {
  en,
  es,
};

const PLACEHOLDER = /\{\{\s*(\w+)\s*\}\}/g;

const interpolate = (text: string, params: TranslationParams = {}): string =>
  text.replace(PLACEHOLDER, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder
  );

export const createTranslator = (language: Language): Translator => {
  const dictionary = DICTIONARIES[language] || DICTIONARIES[DEFAULT_LANGUAGE];
  const pluralRules = new Intl.PluralRules(language);

  // English is the fallback so a missing entry never renders a raw key.
  const t: Translator["t"] = (key, params) =>
    interpolate(dictionary[key] ?? en[key] ?? key, params);

  const plural: Translator["plural"] = (key, count, params = {}) => {
    const form = pluralRules.select(count) === "one" ? "one" : "other";
    return t(`${key}_${form}` as TranslationKey, { count, ...params });
  };

  return { language, t, plural };
};

/**
 * Translator for code that runs outside React and was not handed one. It
 * keeps the historical English text as the default.
 */
export const defaultTranslator = createTranslator(DEFAULT_LANGUAGE);
