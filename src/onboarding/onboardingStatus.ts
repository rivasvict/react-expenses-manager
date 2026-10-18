// Who gets the first-run wizard (design/features/new-user-onboarding/ui/decision.md,
// "Who sees the wizard, and when it ends"): only a new user, and only once. The
// "finished" flag is a device preference kept in localStorage on its own key,
// like the language and the currency, and never enters the entries model, the
// backup or the sync server.
export const ONBOARDING_COMPLETED_STORAGE_KEY = "onboarding.completed";
export const ONBOARDING_ROUTE = "/welcome";

const COMPLETED = "1";

// The keys that show a device has been used: entries, buckets, recurring
// entries, or category lists (written the first time the app loads on a
// version that has them, so an install that was merely opened counts too).
const USED_DATA_KEYS = ["balance", "buckets", "fixedEntries", "categoryLists"];

const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

// An empty array or object, or an unreadable value, is not data.
const holdsData = (stored: string | null): boolean => {
  if (!stored) return false;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed.length > 0;
    return Boolean(parsed) && typeof parsed === "object"
      ? Object.keys(parsed).length > 0
      : false;
  } catch (error) {
    return true;
  }
};

export const isOnboardingCompleted = (): boolean =>
  read(ONBOARDING_COMPLETED_STORAGE_KEY) === COMPLETED;

export const markOnboardingCompleted = (): void => {
  try {
    window.localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, COMPLETED);
  } catch (error) {
    // Nothing to fall back to: the wizard would show again on the next launch.
  }
};

/**
 * A new user has never finished or skipped the wizard and the device holds no
 * data at all. Read once, before the app's own loading writes the default
 * category lists, so a restored backup or any earlier use means "existing".
 */
export const isNewUser = (): boolean =>
  !isOnboardingCompleted() &&
  !USED_DATA_KEYS.some((key) => holdsData(read(key)));
