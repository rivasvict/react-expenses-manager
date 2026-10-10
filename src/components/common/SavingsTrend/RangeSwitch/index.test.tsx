import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RangeSwitch from ".";
import { LanguageProvider } from "../../../../i18n";

const OCTOBER = { year: 2026, month: 9 };
const renderSwitch = (
  props: Partial<React.ComponentProps<typeof RangeSwitch>> = {}
) => {
  const onSelectPreset = jest.fn();
  const onOpenCustom = jest.fn();
  render(
    <LanguageProvider>
      <RangeSwitch
        end={OCTOBER}
        active={{ kind: "preset", id: "6M" }}
        isCustomDisabled={false}
        onSelectPreset={onSelectPreset}
        onOpenCustom={onOpenCustom}
        customButtonRef={null}
        {...props}
      />
    </LanguageProvider>
  );
  return { onSelectPreset, onOpenCustom };
};

describe("RangeSwitch", () => {
  it("names every preset in full and marks the active one", () => {
    renderSwitch();
    expect(screen.getByRole("button", { name: "Last month" })).toHaveTextContent("1M");
    expect(screen.getByRole("button", { name: "Last 12 months" })).toHaveTextContent("1Y");
    expect(screen.getByRole("button", { name: "This year so far" })).toHaveTextContent("YTD");
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Last 3 months" })).toHaveAttribute("aria-pressed", "false");
  });

  it("reports the preset that was tapped", async () => {
    const { onSelectPreset } = renderSwitch();
    await userEvent.click(screen.getByRole("button", { name: "Last 3 months" }));
    expect(onSelectPreset).toHaveBeenCalledWith("3M");
  });

  it("keeps every preset selectable", async () => {
    const { onSelectPreset } = renderSwitch();
    ["Last month", "Last 2 months", "Last 3 months", "Last 6 months", "Last 12 months", "This year so far"].forEach(
      (name) => expect(screen.getByRole("button", { name })).toBeEnabled()
    );
    await userEvent.click(screen.getByRole("button", { name: "Last 12 months" }));
    expect(onSelectPreset).toHaveBeenCalledWith("1Y");
  });

  it("opens the custom range and shows it as selected for a custom span", async () => {
    const { onOpenCustom } = renderSwitch({ active: { kind: "custom", monthsBack: 4 } });
    const custom = screen.getByRole("button", { name: "Custom range" });
    expect(custom).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(custom);
    expect(onOpenCustom).toHaveBeenCalled();
  });

  it("disables only the calendar button when there are no earlier months to pick from", () => {
    renderSwitch({ isCustomDisabled: true });
    expect(screen.getByRole("button", { name: "Custom range" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last 6 months" })).toBeEnabled();
  });
});
