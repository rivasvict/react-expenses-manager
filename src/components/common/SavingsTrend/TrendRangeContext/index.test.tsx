import React from "react";
import { act, renderHook } from "@testing-library/react";
import { TrendRangeProvider, useTrendRange } from ".";
import type { EntriesTree } from "../../../../helpers/savingsChange/savingsChange";

// One entry a month from January to October 2026.
const ENTRIES: EntriesTree = {
  2026: Object.fromEntries(
    Array.from({ length: 10 }, (_, month) => [month, { incomes: [{ amount: "1", type: "income" }] }])
  ),
};
const OCTOBER = { year: 2026, month: 9 };

describe("useTrendRange", () => {
  it("opens on 6M", () => {
    const { result } = renderHook(() => useTrendRange(ENTRIES, OCTOBER));
    expect(result.current.requested).toEqual({ kind: "preset", id: "6M" });
    expect(result.current.resolved).toEqual({ status: "ready", monthsBack: 6 });
  });

  it("shares the pick between the screens inside one provider", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TrendRangeProvider>{children}</TrendRangeProvider>
    );
    const { result } = renderHook(
      () => [useTrendRange(ENTRIES, OCTOBER), useTrendRange(ENTRIES, OCTOBER)],
      { wrapper }
    );
    act(() => result.current[0].setPicked({ kind: "preset", id: "3M" }));
    expect(result.current[1].requested).toEqual({ kind: "preset", id: "3M" });
  });
});
