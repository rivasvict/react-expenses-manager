import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyTheme,
  getStoredThemeId,
  getTheme,
  storeThemeId,
  THEME_CATALOG,
  THEME_STORAGE_KEY,
} from "../themePreference";
import type { Theme } from "../theme.types";

export type ThemeContextValue = {
  /** The active theme, with its palette. */
  theme: Theme;
  /** Every theme of the catalog: the default first, then by id. */
  themes: Theme[];
  /** Applies a theme to the whole app and remembers it on this device. */
  setTheme: (id: string) => void;
};

// Components rendered without a provider (isolated unit tests) get the
// default theme.
const ThemeContext = createContext<ThemeContextValue>({
  theme: THEME_CATALOG[0],
  themes: THEME_CATALOG,
  setTheme: () => undefined,
});

type ThemeProviderProps = {
  children: React.ReactNode;
};

/**
 * Holds the active theme for the whole app. The choice is read from and written
 * to localStorage only (../themePreference.ts). The document is themed before
 * the first render (src/index.tsx); this keeps it in step with every change.
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [themeId, setThemeId] = useState<string>(getStoredThemeId);
  const theme = getTheme(themeId);

  const setTheme = useCallback((id: string) => {
    const next = getTheme(id);
    storeThemeId(next.id);
    applyTheme(next);
    setThemeId(next.id);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // A change made in another tab follows here too.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) setThemeId(getStoredThemeId());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({ theme, themes: THEME_CATALOG, setTheme }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
