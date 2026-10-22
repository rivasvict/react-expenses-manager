import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RangeControls from ".";
import { LanguageProvider } from "../../../../i18n";
import type { EntriesTree } from "../../../../helpers/savingsChange/savingsChange";
import type { TrendRangeState } from "../TrendRangeContext";

afterEach(() => localStorage.clear());

const ENTRIES: EntriesTree = {
  2026: Object.fromEntries(
    Array.from({ length: 10 }, (_, month) => [month, { incomes: [{ amount: "1", type: "income" }] }])
  ),
};
const OCTOBER = { year: 2026, month: 9 };

const renderControls = (resolved: TrendRangeState["resolved"] = { status: "ready", monthsBack: 6 }) => {
  const setPicked = jest.fn();
  const onSelectedDateChange = jest.fn();
  render(
    <LanguageProvider>
      <RangeControls
        entries={ENTRIES}
        selectedDate={OCTOBER}
        onSelectedDateChange={onSelectedDateChange}
        range={{ requested: { kind: "preset", id: "6M" }, resolved, setPicked }}
      />
    </LanguageProvider>
  );
  return { setPicked, onSelectedDateChange };
};

describe("RangeControls", () => {
  it("picks a preset", async () => {
    const { setPicked } = renderControls();
    await userEvent.click(screen.getByRole("button", { name: "Last 3 months" }));
    expect(setPicked).toHaveBeenCalledWith({ kind: "preset", id: "3M" });
  });

  it("opens the custom range sheet and applies its months", async () => {
    const { setPicked } = renderControls();
    await userEvent.click(screen.getByRole("button", { name: "Custom range" }));
    expect(screen.getByRole("dialog", { name: "Custom range" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Show trend" }));
    expect(setPicked).toHaveBeenCalledWith({ kind: "custom", monthsBack: 6 });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("disables the calendar button without earlier months", () => {
    renderControls({ status: "empty" });
    expect(screen.getByRole("button", { name: "Custom range" })).toBeDisabled();
  });
});
