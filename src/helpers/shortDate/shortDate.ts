// Short, locale-formatted dates for entry rows in the category sheets and the
// sync review's category notes ("Oct 12, 2026" / "12 oct 2026", and "Oct 14"
// / "14 oct"), spelled by the platform's own locale data as in the approved
// screens (design/features/category-management/ui/approved/).

const format = (
  timestamp: number,
  language: string,
  options: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(timestamp);
  // A malformed stored date shows nothing rather than breaking the screen.
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language, options).format(date);
};

/** "Oct 12, 2026" in English, "12 oct 2026" in Spanish. */
export const formatShortDate = (timestamp: number, language: string): string =>
  format(timestamp, language, { day: "numeric", month: "short", year: "numeric" });

/** "Oct 14" in English, "14 oct" in Spanish. */
export const formatDayMonth = (timestamp: number, language: string): string =>
  format(timestamp, language, { day: "numeric", month: "short" });
