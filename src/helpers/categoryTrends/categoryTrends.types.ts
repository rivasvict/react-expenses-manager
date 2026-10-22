import type { MonthDate } from "../savingsChange/savingsChange";
import type { CategoryType } from "../categoryLists/categoryLists";

export interface CategoryPoint extends MonthDate {
  /** What the category took in (income) or cost (expense) that month. */
  amount: number;
  /** Whether the category has at least one entry that month. */
  hasEntries: boolean;
}

/** How the end month compares with the reference month for one category. */
export type CategoryChange =
  | { kind: "none" }
  /** The reference month had nothing, so there is no percentage to give. */
  | { kind: "new" }
  | { kind: "up" | "down" | "flat"; percent: number };

/** Whether a change is good news: less spent, or more earned. */
export type CategoryTone = "good" | "bad" | "flat";

export interface CategoryTrend {
  type: CategoryType;
  name: string;
  /** Every month from the reference month to the end month, inclusive. */
  points: CategoryPoint[];
  reference: CategoryPoint;
  end: CategoryPoint;
  /** End amount minus reference amount. */
  difference: number;
  change: CategoryChange;
  tone: CategoryTone;
  total: number;
  months: number;
  average: number;
}
