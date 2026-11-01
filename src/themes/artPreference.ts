/**
 * Whether themes draw their background pictures. A per-device preference like
 * the theme itself, on its own localStorage key: it never touches the entries
 * model, the backup format or the sync server. Pictures are on by default; the
 * switch in the Theme sheet turns them off for every theme.
 */
export const THEME_ART_STORAGE_KEY = "settings.themeArt";

const OFF = "off";

/** True unless the person turned the pictures off (or storage is unreadable). */
export const getStoredThemeArt = (): boolean => {
  try {
    return window.localStorage.getItem(THEME_ART_STORAGE_KEY) !== OFF;
  } catch (error) {
    return true;
  }
};

export const storeThemeArt = (enabled: boolean): void => {
  try {
    window.localStorage.setItem(THEME_ART_STORAGE_KEY, enabled ? "on" : OFF);
  } catch (error) {
    // The choice still applies for this session; it just won't persist.
  }
};

/**
 * `data-theme-art="off"` on <html> hides every picture layer
 * (see the `theme-art` mixin in src/variables.scss); absent means shown.
 */
export const applyThemeArt = (enabled: boolean): void => {
  if (enabled) delete document.documentElement.dataset.themeArt;
  else document.documentElement.dataset.themeArt = OFF;
};
