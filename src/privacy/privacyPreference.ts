/**
 * Privacy mode is a per-device preference, so it lives in localStorage on its
 * own key (like the language and the currency), independent of the entries
 * model, the backup format and the sync server.
 */
export const PRIVACY_MODE_STORAGE_KEY = "settings.privacyMode";

const ON = "on";

/**
 * Whether Privacy mode is on. Off unless the stored value is exactly "on", and
 * also off when storage cannot be read (private mode, blocked site data).
 */
export const getStoredPrivacyMode = (): boolean => {
  try {
    return window.localStorage.getItem(PRIVACY_MODE_STORAGE_KEY) === ON;
  } catch (error) {
    return false;
  }
};

export const storePrivacyMode = (enabled: boolean): void => {
  try {
    if (enabled) {
      window.localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, ON);
    } else {
      window.localStorage.removeItem(PRIVACY_MODE_STORAGE_KEY);
    }
  } catch (error) {
    // The choice still applies for this session; it just won't persist.
  }
};
