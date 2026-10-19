export interface MonthAvailability {
  /** Years with data, oldest first. */
  years: number[];
  /** Whether the month has entries (empty months between entries count). */
  hasMonth: (year: number, month: number) => boolean;
}

/**
 * The months the picker may offer. It follows the rule the Prev/Next steppers
 * use: a month is reachable only when it exists in the entries tree. The
 * selected year is always listed, so the sheet can open on it.
 */
export const getMonthAvailability = (
  entries: Record<string, Record<string, unknown>>,
  selectedYear: number
): MonthAvailability => {
  const years = Object.keys(entries).map(Number);
  if (!years.includes(selectedYear)) years.push(selectedYear);
  years.sort((a, b) => a - b);
  return {
    years,
    hasMonth: (year, month) => Boolean(entries[year]?.[month]),
  };
};
