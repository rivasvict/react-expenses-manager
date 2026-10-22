import React, { createContext, useContext, useState } from "react";
import type { EntriesTree, MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import { getDefaultRange, resolveRange } from "../../../../helpers/savingsTrend/savingsTrend";
import type {
  ResolvedRange,
  TrendRange,
} from "../../../../helpers/savingsTrend/savingsTrend.types";

type PickedRange = [TrendRange | null, (range: TrendRange) => void];

const TrendRangeContext = createContext<PickedRange | null>(null);

/**
 * Holds the range the user picked on the trend screens, so it carries over
 * when the Savings | Categories switch moves between them
 * (design/features/category-trends/ui/decision.md).
 */
export const TrendRangeProvider = ({ children }: { children: React.ReactNode }) => {
  const picked = useState<TrendRange | null>(null);
  return <TrendRangeContext.Provider value={picked}>{children}</TrendRangeContext.Provider>;
};

export interface TrendRangeState {
  /** What the user picked, or the default range until they pick one. */
  requested: TrendRange;
  resolved: ResolvedRange;
  setPicked: (range: TrendRange) => void;
}

/**
 * The range to show at `end`: until the user picks one it is 6M, or the
 * longest preset the history reaches. Outside a `TrendRangeProvider` the pick
 * is kept by the calling screen alone.
 */
export const useTrendRange = (entries: EntriesTree, end: MonthDate): TrendRangeState => {
  const shared = useContext(TrendRangeContext);
  const local = useState<TrendRange | null>(null);
  const [picked, setPicked] = shared ?? local;
  const requested = picked ?? getDefaultRange(entries, end);
  return { requested, resolved: resolveRange(entries, end, requested), setPicked };
};
