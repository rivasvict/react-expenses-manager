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

export const JANUARY  = 0;
export const FEBRUARY = 1;
export const MARCH    = 2;
export const APRIL    = 3;
export const MAY      = 4;
export const JUNE     = 5;
export const JULY     = 6;
export const AUGUST   = 7;
export const SEPTEMBER = 8;
export const OCTOBER  = 9;
export const NOVEMBER = 10;
export const DECEMBER = 11;
