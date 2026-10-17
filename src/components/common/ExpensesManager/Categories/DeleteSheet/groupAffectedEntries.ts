// The delete sheet's list (design/features/category-management/ui/decision.md):
// the affected entries grouped by month, newest month first and newest entry
// first, then the fixed (recurring) entries in a last group.
import dayjs from "dayjs";
import { AffectedEntry } from "../../../../../helpers/categoryChanges/categoryChanges";

export interface AffectedEntryGroup {
  /** "2026-10" for a month, "recurring" for the fixed entries. */
  key: string;
  /** Present for a month group: its year and 0-indexed month. */
  month?: { year: number; month: number };
  entries: AffectedEntry[];
}

export const groupAffectedEntries = (
  entries: AffectedEntry[]
): AffectedEntryGroup[] => {
  const dated = entries
    .filter((entry) => !entry.fixed)
    .sort((first, second) => (second.date || 0) - (first.date || 0));
  const groups: AffectedEntryGroup[] = [];
  dated.forEach((entry) => {
    const date = dayjs(entry.date);
    const key = date.format("YYYY-MM");
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({
        key,
        month: { year: date.year(), month: date.month() },
        entries: [entry],
      });
    }
  });
  const fixed = entries.filter((entry) => entry.fixed);
  return fixed.length
    ? [...groups, { key: "recurring", entries: fixed }]
    : groups;
};
