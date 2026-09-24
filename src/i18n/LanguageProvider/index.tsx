import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DEFAULT_LANGUAGE, isSupportedLanguage, Language } from "../languages";
import {
  getStoredLanguage,
  LANGUAGE_STORAGE_KEY,
  storeLanguage,
} from "../languagePreference";
import { createTranslator, Translator } from "../translator";

export type LanguageContextValue = Translator & {
  /** Switches the UI language and remembers it on this device. */
  setLanguage: (language: Language) => void;
};

// Components rendered without a provider (isolated unit tests) still get a
// working English translator instead of crashing.
const LanguageContext = createContext<LanguageContextValue>({
  ...createTranslator(DEFAULT_LANGUAGE),
  setLanguage: () => undefined,
});

type LanguageProviderProps = {
  children: React.ReactNode;
};

/**
 * Holds the UI language for the whole app. The choice is read from and
 * written to localStorage only (./languagePreference.ts), so it works the same
 * whether or not a sync server is up, and it never touches the entries model.
 */
export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    storeLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  // Screen readers and the browser's own UI (hyphenation, spell-check) pick
  // their language from <html lang>.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // A change made in another tab follows here too.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === LANGUAGE_STORAGE_KEY &&
        isSupportedLanguage(event.newValue)
      ) {
        setLanguageState(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({ ...createTranslator(language), setLanguage }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextValue =>
  useContext(LanguageContext);

/**
 * Injects the `useTranslation()` value (`t`, `plural`, `language`,
 * `setLanguage`) as props, for class components that cannot call hooks.
 */
export const withTranslation = <Props extends object>(
  Component: React.ComponentType<Props & LanguageContextValue>
) => {
  const WithTranslation = (props: Props) => (
    <Component {...props} {...useTranslation()} />
  );
  return WithTranslation;
};
