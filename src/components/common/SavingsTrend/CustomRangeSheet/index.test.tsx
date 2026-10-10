import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CustomRangeSheet from ".";
import { LanguageProvider } from "../../../../i18n";

// Recorded months: Jan to Jun 2026.
const MONTHS = [0, 1, 2, 3, 4, 5].map((month) => ({ year: 2026, month }));

const renderSheet = (initialFrom = MONTHS[1], initialTo = MONTHS[5]) => {
  const onApply = jest.fn();
  const onClose = jest.fn();
  render(
    <LanguageProvider>
      <CustomRangeSheet
        months={MONTHS}
        initialFrom={initialFrom}
        initialTo={initialTo}
        onApply={onApply}
        onClose={onClose}
      />
    </LanguageProvider>
  );
  return { onApply, onClose };
};

const optionNames = (select: HTMLElement) =>
  within(select).getAllByRole("option").map((option) => option.textContent);

describe("CustomRangeSheet", () => {
  it("opens on the range being shown, with the heading focused", () => {
    renderSheet();
    expect(screen.getByRole("dialog", { name: "Custom range" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Custom range" })).toHaveFocus();
    expect(screen.getByLabelText("From")).toHaveDisplayValue("February 2026");
    expect(screen.getByLabelText("To")).toHaveDisplayValue("June 2026");
  });

  it("offers only months that keep From before To, newest first", () => {
    renderSheet();
    expect(optionNames(screen.getByLabelText("From"))).toEqual([
      "May 2026",
      "April 2026",
      "March 2026",
      "February 2026",
      "January 2026",
    ]);
    expect(optionNames(screen.getByLabelText("To"))).toEqual([
      "June 2026",
      "May 2026",
      "April 2026",
      "March 2026",
    ]);
  });

  it("narrows the other list when one changes", async () => {
    renderSheet();
    await userEvent.selectOptions(screen.getByLabelText("From"), "April 2026");
    expect(optionNames(screen.getByLabelText("To"))).toEqual([
      "June 2026",
      "May 2026",
    ]);
  });

  it("applies the chosen pair", async () => {
    const { onApply } = renderSheet();
    await userEvent.selectOptions(screen.getByLabelText("From"), "January 2026");
    await userEvent.selectOptions(screen.getByLabelText("To"), "April 2026");
    await userEvent.click(screen.getByRole("button", { name: "Show trend" }));
    expect(onApply).toHaveBeenCalledWith({ from: MONTHS[0], to: MONTHS[3] });
  });

  it.each([
    ["Cancel button", () => userEvent.click(screen.getByRole("button", { name: "Cancel" }))],
    ["close button", () => userEvent.click(screen.getByRole("button", { name: "Close" }))],
    ["Escape key", () => userEvent.keyboard("{Escape}")],
  ])("closes without applying from the %s", async (_name, act) => {
    const { onApply, onClose } = renderSheet();
    await act();
    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });
});
