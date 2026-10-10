import type { MonthDate, SavingsChange } from "../savingsChange/savingsChange";

export type PresetId = "1M" | "2M" | "3M" | "6M" | "1Y" | "YTD";

/** What the user asked for: a preset, or a custom span in whole months. */
export type TrendRange =
  | { kind: "preset"; id: PresetId }
  | { kind: "custom"; monthsBack: number };

export interface TrendPoint extends MonthDate {
  savings: number;
  hasEntries: boolean;
}

export interface SavingsTrend {
  /** Every month from the reference month to the end month, inclusive. */
  points: TrendPoint[];
  reference: TrendPoint;
  end: TrendPoint;
  /** End savings minus reference savings. */
  difference: number;
  /** Percentage change; `none` when the reference month cannot be compared. */
  change: SavingsChange;
}

/** What a requested range can show; see `resolveRange`. */
export type ResolvedRange =
  | { status: "ready"; monthsBack: number }
  | { status: "short"; monthsBack: number; earliest: MonthDate }
  | { status: "empty" };
