import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RangeSwitch from ".";
import { LanguageProvider } from "../../../../i18n";
import type { PresetId } from "../../../../helpers/savingsTrend/savingsTrend.types";

const OCTOBER = { year: 2026, month: 9 };
const ALL: Record<PresetId, boolean> = {
  "1M": true,
  "2M": true,
  "3M": true,
  "6M": true,
  "1Y": true,
  YTD: true,
};

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
        available={ALL}
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

  it("disables presets that are not available", async () => {
    const { onSelectPreset } = renderSwitch({ available: { ...ALL, "1Y": false } });
    const oneYear = screen.getByRole("button", { name: "Last 12 months" });
    expect(oneYear).toBeDisabled();
    await userEvent.click(oneYear);
    expect(onSelectPreset).not.toHaveBeenCalled();
  });

  it("opens the custom range and shows it as selected for a custom span", async () => {
    const { onOpenCustom } = renderSwitch({ active: { kind: "custom", monthsBack: 4 } });
    const custom = screen.getByRole("button", { name: "Custom range" });
    expect(custom).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Last 6 months" })).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(custom);
    expect(onOpenCustom).toHaveBeenCalled();
  });

  it("disables the custom button too when there is nothing to compare with", () => {
    renderSwitch({
      active: null,
      available: { "1M": false, "2M": false, "3M": false, "6M": false, "1Y": false, YTD: false },
    });
    expect(screen.getByRole("button", { name: "Custom range" })).toBeDisabled();
  });
});
