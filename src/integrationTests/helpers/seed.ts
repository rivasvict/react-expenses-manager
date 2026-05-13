import { v4 as uuidv4 } from "uuid";

export interface SeedEntry {
  date: number;
  amount: string;
  description?: string;
  type: "income" | "expense";
  categories_path: string;
}

export type SeededEntry = SeedEntry & { id: string };

export function seedEntries(entries: SeedEntry[]): SeededEntry[] {
  const withIds = entries.map((e) => ({ ...e, id: uuidv4() }));
  localStorage.setItem("balance", JSON.stringify(withIds));
  return withIds;
}

/** Returns a Unix-ms timestamp. month is 0-indexed (0 = January, 4 = May). */
export function ts(year: number, month: number, day = 15): number {
  return new Date(year, month, day).getTime();
}

export const MAY_2026 = 4;   // dayjs month index for May
export const YEAR_2026 = 2026;
