import {
  compareSavings,
  EntriesTree,
  getSavingsOfMonth,
  MonthDate,
  monthHasEntries,
} from "../savingsChange/savingsChange";
import type {
  PresetId,
  SavingsTrend,
  TrendPoint,
  TrendRange,
} from "./savingsTrend.types";

// How the Savings trend screen turns a range ("6M", "YTD", a custom span) into
// the monthly points it draws (design/features/savings-trend/ui/decision.md).

export const PRESET_IDS: PresetId[] = ["1M", "2M", "3M", "6M", "1Y", "YTD"];

const FIXED_PRESET_MONTHS = { "1M": 1, "2M": 2, "3M": 3, "6M": 6, "1Y": 12 };

const MONTHS_IN_YEAR = 12;

export const toMonthIndex = ({ year, month }: MonthDate) =>
  year * MONTHS_IN_YEAR + month;

export const fromMonthIndex = (index: number): MonthDate => ({
  year: Math.floor(index / MONTHS_IN_YEAR),
  month: index % MONTHS_IN_YEAR,
});

/** `YTD` reaches back to January of the end month's year. */
export const getPresetMonthsBack = (id: PresetId, end: MonthDate) =>
  id === "YTD" ? end.month : FIXED_PRESET_MONTHS[id];

/** Every month the app has recorded (the entries tree), oldest first. */
export const getRecordedMonths = (entries: EntriesTree): MonthDate[] =>
  Object.keys(entries || {})
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((year) =>
      Object.keys(entries[year] || {})
        .map(Number)
        .sort((a, b) => a - b)
        .map((month) => ({ year, month }))
    );

/** How many months of history lie before `end`; 0 means nothing to compare. */
const getAvailableMonthsBack = (entries: EntriesTree, end: MonthDate) => {
  const [first] = getRecordedMonths(entries);
  return first ? Math.max(0, toMonthIndex(end) - toMonthIndex(first)) : 0;
};

/**
 * How many months back the range reaches at the given end month, or null when
 * no earlier month has been recorded (nothing to compare with). Every preset
 * is always selectable: one that reaches before the first recorded month is
 * clamped to it, and `YTD` in January (nothing earlier in the year) compares
 * with the month before, like 1M.
 */
export const getMonthsBack = (
  entries: EntriesTree,
  end: MonthDate,
  requested: TrendRange
): number | null => {
  const available = getAvailableMonthsBack(entries, end);
  if (available < 1) return null;
  const asked =
    requested.kind === "custom"
      ? requested.monthsBack
      : getPresetMonthsBack(requested.id, end);
  return Math.min(Math.max(asked, 1), available);
};

const toPoint = (entries: EntriesTree, date: MonthDate): TrendPoint => ({
  ...date,
  savings: getSavingsOfMonth(entries, date),
  hasEntries: monthHasEntries(entries, date),
});

/** The monthly savings from `monthsBack` months before `end` up to `end`. */
export const getSavingsTrend = (
  entries: EntriesTree,
  end: MonthDate,
  monthsBack: number
): SavingsTrend => {
  const endIndex = toMonthIndex(end);
  const points = Array.from({ length: monthsBack + 1 }, (_, offset) =>
    toPoint(entries, fromMonthIndex(endIndex - monthsBack + offset))
  );
  const reference = points[0];
  const endPoint = points[points.length - 1];
  return {
    points,
    reference,
    end: endPoint,
    difference: endPoint.savings - reference.savings,
    change: compareSavings(entries, reference, end),
  };
};

/** The reference month of a range, for pre-selecting the custom range sheet. */
export const getReferenceMonth = (end: MonthDate, monthsBack: number) =>
  fromMonthIndex(toMonthIndex(end) - monthsBack);
