import { calculateTotal } from "../general";
import { getSum } from "../entriesHelper/entriesHelper";

// How the selected month's savings moved against the month before it, as the
// dashboard's savings badge shows it (design/features/savings-delta/ui/decision.md).

export interface MonthDate {
  year: number;
  month: number;
}

export type SavingsChange =
  | { kind: "none" }
  | { kind: "up" | "down" | "flat"; percent: number };

interface MonthEntries {
  incomes?: unknown[];
  expenses?: unknown[];
}

export type EntriesTree = Record<number, Record<number, MonthEntries> | undefined>;

// From here up the badge would only grow wider without saying anything new.
const PERCENT_CAP = 1000;

export const getPreviousMonth = ({ year, month }: MonthDate): MonthDate =>
  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };

const getMonthEntries = (
  entries: EntriesTree,
  { year, month }: MonthDate
): MonthEntries => entries?.[year]?.[month] || {};

const hasEntries = ({ incomes = [], expenses = [] }: MonthEntries) =>
  incomes.length + expenses.length > 0;

// Incomes minus expenses: the same figure the dashboard's balance hero shows.
const getMonthSavings = ({ incomes = [], expenses = [] }: MonthEntries) =>
  calculateTotal(
    getSum({ entryType: "incomes", entries: { incomes } }),
    getSum({ entryType: "expenses", entries: { expenses } })
  );

// One decimal, so "0.0%" is exactly what reads as "no change".
const roundToTenth = (value: number) => Math.round(value * 10) / 10;

/**
 * Compares the savings of `end` with those of `reference`. The change is
 * relative to the size of the reference savings, so going from -$200 to $100
 * is +150%. There is nothing to compare when the reference month has no
 * entries or saved exactly $0.00 (a percentage of zero is undefined).
 */
export const compareSavings = (
  entries: EntriesTree,
  reference: MonthDate,
  end: MonthDate
): SavingsChange => {
  const referenceEntries = getMonthEntries(entries, reference);
  const referenceSavings = getMonthSavings(referenceEntries);
  if (!hasEntries(referenceEntries) || referenceSavings === 0) {
    return { kind: "none" };
  }
  const endSavings = getMonthSavings(getMonthEntries(entries, end));
  const percent = roundToTenth(
    ((endSavings - referenceSavings) / Math.abs(referenceSavings)) * 100
  );
  if (percent === 0) return { kind: "flat", percent: 0 };
  return { kind: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
};

/** The selected month's savings against the month before it. */
export const getSavingsChange = (
  entries: EntriesTree,
  selectedDate: MonthDate
): SavingsChange =>
  compareSavings(entries, getPreviousMonth(selectedDate), selectedDate);

/** Savings (incomes minus expenses) of one month; $0.00 when it has no entries. */
export const getSavingsOfMonth = (
  entries: EntriesTree,
  date: MonthDate
): number => getMonthSavings(getMonthEntries(entries, date));

/** Whether the month has at least one income or expense. */
export const monthHasEntries = (
  entries: EntriesTree,
  date: MonthDate
): boolean => hasEntries(getMonthEntries(entries, date));

/** "12.5%", or ">999%" once the change reaches 1,000%. */
export const formatPercent = (percent: number) =>
  percent >= PERCENT_CAP
    ? `>${PERCENT_CAP - 1}%`
    : `${percent.toFixed(1)}%`;
