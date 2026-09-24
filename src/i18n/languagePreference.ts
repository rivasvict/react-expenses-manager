import { DEFAULT_LANGUAGE, isSupportedLanguage, Language } from "./languages";

/**
 * The language preference is a per-device UI setting, so it lives in
 * localStorage on its own key — independent of the entries model and of
 * whether a sync server is reachable.
 */
export const LANGUAGE_STORAGE_KEY = "settings.language";

/**
 * The stored language, or the default when nothing (or something unknown) is
 * stored. Storage access can throw (private mode, blocked site data), in
 * which case the app still renders in the default language.
 */
export const getStoredLanguage = (): Language => {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(storedLanguage)
      ? storedLanguage
      : DEFAULT_LANGUAGE;
  } catch (error) {
    return DEFAULT_LANGUAGE;
  }
};

export const storeLanguage = (language: Language): void => {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    // The choice still applies for this session; it just won't persist.
  }
};
