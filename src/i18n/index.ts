export {
  LanguageProvider,
  useTranslation,
  withTranslation,
} from "./LanguageProvider";
export type { LanguageContextValue } from "./LanguageProvider";
export { createTranslator, defaultTranslator } from "./translator";
export { getSyncErrorMessage } from "./syncErrorMessage";
export { default as Trans } from "./Trans";
export type { PluralKey, Translator } from "./translator";
export type { TranslationKey } from "./translations/en";
export {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
} from "./languages";
export type { Language } from "./languages";
