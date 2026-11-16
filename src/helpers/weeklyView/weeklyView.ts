/**
 * How a bucket's week-by-week spending is drawn on its screen
 * (design/features/bucket-expenses/ui/decision.md). Like the language and the
 * currency it is a per-device preference: it lives in localStorage on its own
 * key and never touches the entries model, the backup format, the sync server
 * or the first-run wizard.
 */
export const WEEKLY_VIEW_STORAGE_KEY = "settings.weeklyView";

/** `rows` bars each week beside its expenses, `bars` a column chart, `line` one line through the month. */
export const WEEKLY_VIEWS = ["rows", "bars", "line"] as const;

export type WeeklyView = (typeof WEEKLY_VIEWS)[number];

export const DEFAULT_WEEKLY_VIEW: WeeklyView = "rows";

export const isWeeklyView = (value: unknown): value is WeeklyView =>
  typeof value === "string" &&
  (WEEKLY_VIEWS as readonly string[]).includes(value);

/**
 * The stored view, or the week rows when nothing (or something unknown) is
 * stored or storage cannot be read (private mode, blocked site data).
 */
export const getStoredWeeklyView = (): WeeklyView => {
  try {
    const stored = window.localStorage.getItem(WEEKLY_VIEW_STORAGE_KEY);
    return isWeeklyView(stored) ? stored : DEFAULT_WEEKLY_VIEW;
  } catch (error) {
    return DEFAULT_WEEKLY_VIEW;
  }
};

export const storeWeeklyView = (view: WeeklyView): void => {
  try {
    window.localStorage.setItem(WEEKLY_VIEW_STORAGE_KEY, view);
  } catch (error) {
    // Nothing to fall back to: the screen keeps the previous view.
  }
};
