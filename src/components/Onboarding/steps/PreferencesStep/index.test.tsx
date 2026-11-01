import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "../../../../i18n";
import { ThemeProvider } from "../../../../themes";
import PreferencesStep from ".";

beforeEach(() => localStorage.clear());

const renderStep = (props = {}) => {
  const handlers = { onCurrencyChange: jest.fn(), onPrivacyModeChange: jest.fn() };
  render(
    <LanguageProvider>
      <ThemeProvider>
        <PreferencesStep currency="USD" privacyMode={false} {...handlers} {...props} />
      </ThemeProvider>
    </LanguageProvider>
  );
  return handlers;
};

describe("PreferencesStep", () => {
  it("preselects the language, currency and Privacy mode it is given", () => {
    renderStep({ currency: "GBP", privacyMode: true });
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "British Pound" })).toBeChecked();
    expect(screen.getByRole("switch", { name: /Privacy mode/ })).toBeChecked();
  });

  it("switches the language at once and remembers it on this device", async () => {
    renderStep();
    await userEvent.click(screen.getByRole("radio", { name: "Español" }));
    expect(localStorage.getItem("settings.language")).toBe("es");
    expect(screen.getByRole("radiogroup", { name: "Idioma" })).toBeInTheDocument();
  });

  it("reports a currency pick and a Privacy mode change without storing them", async () => {
    const { onCurrencyChange, onPrivacyModeChange } = renderStep();
    await userEvent.click(screen.getByRole("radio", { name: "Euro" }));
    await userEvent.click(screen.getByRole("switch", { name: /Privacy mode/ }));
    expect(onCurrencyChange).toHaveBeenCalledWith("EUR");
    expect(onPrivacyModeChange).toHaveBeenCalledWith(true);
    expect(localStorage.getItem("settings.currency")).toBeNull();
    expect(localStorage.getItem("settings.privacyMode")).toBeNull();
  });

  it("offers the themes in a strip, with the stored one checked", () => {
    renderStep();
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio", { name: /^[A-Z]/ }).length).toBeGreaterThan(15);
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).toBeChecked();
  });

  it("applies and stores a picked theme at once", async () => {
    renderStep();
    await userEvent.click(screen.getByRole("radio", { name: "All Hallows" }));
    expect(screen.getByRole("radio", { name: "All Hallows" })).toBeChecked();
    expect(localStorage.getItem("settings.theme")).toBe("all-hallows");
    expect(document.documentElement.dataset.theme).toBe("all-hallows");
  });

  it("draws the previews in the currency being picked", () => {
    renderStep({ currency: "EUR" });
    expect(screen.getAllByText("€1,620.00").length).toBeGreaterThan(0);
  });
});
