import type { TrendPoint } from "./savingsTrend.types";

// The "Total saved" tab of the Savings trend screen: what a range as a whole
// put aside (design/features/savings-trend-total/ui/decision.md).

export interface TotalSaved {
  /** The savings of every month in the range added up. */
  total: number;
  /** How many months the range spans, both ends included. */
  months: number;
  /** `total` divided by `months`. */
  average: number;
}

/** Every month's savings added together; a month without entries adds 0. */
export const getTotalSaved = (points: TrendPoint[]): TotalSaved => {
  const total = points.reduce((sum, point) => sum + point.savings, 0);
  return {
    total,
    months: points.length,
    average: points.length ? total / points.length : 0,
  };
};

/** What had been saved by the end of each month, from the first month on. */
export const getRunningTotals = (points: TrendPoint[]): number[] => {
  let running = 0;
  return points.map((point) => {
    running += point.savings;
    return running;
  });
};
