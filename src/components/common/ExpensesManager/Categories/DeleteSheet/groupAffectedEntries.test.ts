import { groupAffectedEntries } from "./groupAffectedEntries";

const dated = (id: string, iso: string) => ({
  id,
  fixed: false,
  description: id,
  amount: "1",
  date: new Date(iso).getTime(),
  type: "expense" as const,
});

describe("groupAffectedEntries", () => {
  it("groups by month, newest month and newest entry first, with fixed entries last", () => {
    const groups = groupAffectedEntries([
      dated("sep-9", "2026-09-09T12:00:00"),
      { id: "f1", fixed: true, description: "Plan", amount: "5", type: "expense" },
      dated("oct-4", "2026-10-04T12:00:00"),
      dated("sep-28", "2026-09-28T12:00:00"),
      dated("oct-12", "2026-10-12T12:00:00"),
    ]);

    expect(groups.map((group) => [group.key, group.entries.map((entry) => entry.id)])).toEqual([
      ["2026-10", ["oct-12", "oct-4"]],
      ["2026-09", ["sep-28", "sep-9"]],
      ["recurring", ["f1"]],
    ]);
    expect(groups[0].month).toEqual({ year: 2026, month: 9 });
    expect(groups[2].month).toBeUndefined();
  });

  it("has no recurring group without fixed entries", () => {
    expect(groupAffectedEntries([dated("a", "2026-01-02T12:00:00")])).toHaveLength(1);
    expect(groupAffectedEntries([])).toEqual([]);
  });
});
