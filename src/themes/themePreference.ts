import { DEFAULT_THEME_ID, THEME_CATALOG } from "./catalog.generated";
import { applyThemeArt, getStoredThemeArt } from "./artPreference";
import type { Theme } from "./theme.types";

/**
 * The theme is a per-device preference, so it lives in localStorage on its own
 * key (like the language, the currency and Privacy mode): it never touches the
 * entries model, the backup format or the sync server. It also does not make
 * someone a "new user" (see ../onboarding/onboardingStatus.ts).
 */
export const THEME_STORAGE_KEY = "settings.theme";

export { DEFAULT_THEME_ID, THEME_CATALOG };

export const isThemeId = (value: unknown): value is string =>
  typeof value === "string" && THEME_CATALOG.some((theme) => theme.id === value);

/** The theme with this id, or the default theme when it is unknown. */
export const getTheme = (id: unknown): Theme =>
  THEME_CATALOG.find((theme) => theme.id === id) ?? THEME_CATALOG[0];

/**
 * The stored theme id, or the default theme's when nothing (or something
 * unknown) is stored or storage cannot be read (private mode, blocked data).
 */
export const getStoredThemeId = (): string => {
  try {
    const storedId = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(storedId) ? storedId : DEFAULT_THEME_ID;
  } catch (error) {
    return DEFAULT_THEME_ID;
  }
};

export const storeThemeId = (id: string): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch (error) {
    // The choice still applies for this session; it just won't persist.
  }
};

/**
 * Recolors the document: `data-theme` on <html> selects the theme's CSS
 * variables (src/styles/themes.generated.css) and the browser chrome follows
 * the theme's page color through <meta name="theme-color">.
 */
export const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme.id;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme.color["bg-page"]);
};

/** Applies the stored theme and picture setting; called once before the first render. */
export const applyStoredTheme = (): void => {
  applyTheme(getTheme(getStoredThemeId()));
  applyThemeArt(getStoredThemeArt());
};
