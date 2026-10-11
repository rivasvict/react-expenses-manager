import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CurrencySection from "./index";
import { LanguageProvider } from "../../../i18n";
import {
  CURRENCY_STORAGE_KEY,
  getStoredCurrency,
} from "../../../helpers/currency/currency";

const renderSection = () =>
  render(
    <LanguageProvider>
      <CurrencySection />
    </LanguageProvider>
  );

describe("CurrencySection", () => {
  beforeEach(() => localStorage.clear());

  it("offers each currency with its symbol, US Dollar selected by default", () => {
    renderSection();

    expect(screen.getByRole("group", { name: "Currency" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /US Dollar/ })).toBeChecked();
    expect(screen.getByText("€ · EUR")).toBeInTheDocument();
  });

  it("remembers the picked currency", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole("radio", { name: /Euro/ }));

    expect(screen.getByRole("radio", { name: /Euro/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /US Dollar/ })).not.toBeChecked();
    expect(getStoredCurrency()).toBe("EUR");
  });

  it("opens on the stored currency", () => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, "GBP");
    renderSection();

    expect(screen.getByRole("radio", { name: /British Pound/ })).toBeChecked();
  });
});
