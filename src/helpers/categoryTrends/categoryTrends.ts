import { getSum } from "../entriesHelper/entriesHelper";
import {
  CategoryLists,
  CategoryType,
  findCategoryName,
  pathMatchesCategory,
} from "../categoryLists/categoryLists";
import type {
  EntriesTree,
  MonthDate,
} from "../savingsChange/savingsChange";
import { fromMonthIndex, toMonthIndex } from "../savingsTrend/savingsTrend";
import type {
  CategoryChange,
  CategoryPoint,
  CategoryTone,
  CategoryTrend,
} from "./categoryTrends.types";

// How the category trend screens turn a category and a range into monthly
// amounts, a change against the reference month and a ranking
// (design/features/category-trends/ui/decision.md).

const LIST_KEY = { expense: "expenses", income: "incomes" } as const;

// One decimal, so "0.0%" is exactly what reads as "no change".
const roundToTenth = (value: number) => Math.round(value * 10) / 10;

const getCategoryEntries = (
  entries: EntriesTree,
  type: CategoryType,
  name: string,
  { year, month }: MonthDate
): { amount?: string; categories_path?: string }[] => {
  const monthEntries = (entries?.[year]?.[month] || {}) as Record<
    string,
    { amount?: string; categories_path?: string }[] | undefined
  >;
  return (monthEntries[LIST_KEY[type]] || []).filter((entry) =>
    pathMatchesCategory(entry.categories_path, name)
  );
};

const toPoint = (
  entries: EntriesTree,
  type: CategoryType,
  name: string,
  date: MonthDate
): CategoryPoint => {
  const matching = getCategoryEntries(entries, type, name, date);
  return {
    ...date,
    // Expenses sum as negative amounts; a category shows what it cost.
    amount: matching.length
      ? Math.abs(
          getSum({
            entryType: LIST_KEY[type],
            entries: { [LIST_KEY[type]]: matching },
          })
        )
      : 0,
    hasEntries: matching.length > 0,
  };
};

const getChange = (reference: number, end: number): CategoryChange => {
  if (reference === 0) return end === 0 ? { kind: "flat", percent: 0 } : { kind: "new" };
  const percent = roundToTenth(((end - reference) / Math.abs(reference)) * 100);
  if (percent === 0) return { kind: "flat", percent: 0 };
  return { kind: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
};

/** Less spent, or more earned, is good; the opposite is bad. */
export const getTone = (type: CategoryType, difference: number): CategoryTone => {
  if (difference === 0) return "flat";
  const isGood = type === "income" ? difference > 0 : difference < 0;
  return isGood ? "good" : "bad";
};

/** The category's monthly amounts from `monthsBack` months before `end` up to `end`. */
export const getCategoryTrend = (
  entries: EntriesTree,
  type: CategoryType,
  name: string,
  end: MonthDate,
  monthsBack: number
): CategoryTrend => {
  const endIndex = toMonthIndex(end);
  const points = Array.from({ length: monthsBack + 1 }, (_, offset) =>
    toPoint(entries, type, name, fromMonthIndex(endIndex - monthsBack + offset))
  );
  const reference = points[0];
  const endPoint = points[points.length - 1];
  const total = points.reduce((sum, point) => sum + point.amount, 0);
  const difference = endPoint.amount - reference.amount;
  return {
    type,
    name,
    points,
    reference,
    end: endPoint,
    difference,
    change: getChange(reference.amount, endPoint.amount),
    tone: getTone(type, difference),
    total,
    months: points.length,
    average: total / points.length,
  };
};

/** Whether the category has any entry in the trend's months. */
export const hasEntriesInRange = (trend: CategoryTrend) =>
  trend.points.some((point) => point.hasEntries);

// A category that was nothing and now is something is the biggest mover.
const rankKey = ({ change }: CategoryTrend) =>
  change.kind === "new" ? Infinity : change.kind === "none" ? 0 : change.kind === "flat" ? 0 : change.percent;

/**
 * The categories of one type that have entries in the range, the biggest
 * change first: by absolute percentage, then by the size of the amount change,
 * then by name.
 */
export const getRankedCategoryTrends = (
  entries: EntriesTree,
  lists: CategoryLists,
  type: CategoryType,
  end: MonthDate,
  monthsBack: number
): CategoryTrend[] =>
  lists[type]
    .map((name) => getCategoryTrend(entries, type, name, end, monthsBack))
    .filter(hasEntriesInRange)
    .sort(
      (a, b) =>
        rankKey(b) - rankKey(a) ||
        Math.abs(b.difference) - Math.abs(a.difference) ||
        a.name.localeCompare(b.name)
    );

// From here up the pill would only grow wider without saying anything new.
const PERCENT_CAP = 1000;

/** "42%": the list rows round to whole percentages; ">999%" past the cap. */
export const formatWholePercent = (percent: number) =>
  percent >= PERCENT_CAP ? `>${PERCENT_CAP - 1}%` : `${Math.round(percent)}%`;

/** `/category-trends/expense/Eating%20out`: one category's trend. */
export const categoryTrendPath = (type: CategoryType, name: string) =>
  `/category-trends/${type}/${encodeURIComponent(name)}`;

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    // A bare "%" ("50% off") is already as decoded as it gets.
    return segment;
  }
};

/**
 * The category a `categoryTrendPath` segment names, as the router hands it
 * over. The router (history 4) decodes the path only partly, so "Café & bar"
 * arrives as "Café %26 bar" and "Rent/Mortgage" as "Rent%2FMortgage"; the
 * segment is matched as given first, then fully decoded.
 */
export const findCategoryInPath = (names: string[], segment: string) =>
  findCategoryName(names, segment) ?? findCategoryName(names, decodeSegment(segment));
