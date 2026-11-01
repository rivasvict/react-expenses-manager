import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Settings from "./index";
import { LanguageProvider } from "../../i18n";
import { PrivacyProvider } from "../../privacy";
import { ThemeProvider } from "../../themes";
import { PRIVACY_MODE_STORAGE_KEY } from "../../privacy/privacyPreference";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/languagePreference";
import {
  CURRENCY_STORAGE_KEY,
  getStoredCurrency,
} from "../../helpers/currency/currency";

const renderSettings = () =>
  render(
    <LanguageProvider>
      <ThemeProvider>
        <PrivacyProvider>
          <MemoryRouter>
            <Settings />
          </MemoryRouter>
        </PrivacyProvider>
      </ThemeProvider>
    </LanguageProvider>,
  );

const languageRow = () => screen.getByRole("button", { name: /^Language/ });
const currencyRow = () => screen.getByRole("button", { name: /^Currency/ });

describe("Settings", () => {
  beforeEach(() => localStorage.clear());

  it("shows each setting as a row with its current value, no sheet open", () => {
    renderSettings();

    expect(languageRow()).toHaveTextContent("English");
    expect(currencyRow()).toHaveTextContent("$ · USD");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on the stored language and currency", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    localStorage.setItem(CURRENCY_STORAGE_KEY, "GBP");
    renderSettings();

    expect(screen.getByText("Ajustes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Idioma/ })).toHaveTextContent(
      "Español",
    );
    expect(screen.getByRole("button", { name: /^Moneda/ })).toHaveTextContent(
      "£ · GBP",
    );
  });

  it("offers every language by its own name in the Language sheet", async () => {
    renderSettings();

    await userEvent.click(languageRow());

    expect(
      screen.getByRole("dialog", { name: "Language" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /English/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Español/ })).not.toBeChecked();
    // The other language carries a gloss in the current one.
    expect(screen.getByText("Spanish")).toBeInTheDocument();
  });

  it("switches the whole screen to the picked language and closes the sheet", async () => {
    renderSettings();

    await userEvent.click(languageRow());
    await userEvent.click(screen.getByRole("radio", { name: /Español/ }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Idioma/ })).toHaveTextContent(
      "Español",
    );
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
  });

  it("offers every currency in the Currency sheet and remembers the pick", async () => {
    renderSettings();

    await userEvent.click(currencyRow());

    expect(
      screen.getByRole("dialog", { name: "Currency" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "US Dollar" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(12);

    await userEvent.click(screen.getByRole("radio", { name: "Euro" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(currencyRow()).toHaveTextContent("€ · EUR");
    expect(getStoredCurrency()).toBe("EUR");
  });

  it("closes without changing anything from Close, and returns focus to the row", async () => {
    renderSettings();

    await userEvent.click(currencyRow());
    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(currencyRow()).toHaveFocus();
    expect(currencyRow()).toHaveTextContent("$ · USD");
  });

  it("closes on Escape", async () => {
    renderSettings();

    await userEvent.click(languageRow());
    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(languageRow()).toHaveFocus();
  });

  it("has Privacy mode off by default and remembers it once turned on", async () => {
    renderSettings();
    const privacySwitch = () =>
      screen.getByRole("switch", { name: /^Privacy mode/ });

    expect(privacySwitch()).not.toBeChecked();

    await userEvent.click(privacySwitch());

    expect(privacySwitch()).toBeChecked();
    expect(localStorage.getItem(PRIVACY_MODE_STORAGE_KEY)).toBe("on");

    await userEvent.click(privacySwitch());

    expect(privacySwitch()).not.toBeChecked();
    expect(localStorage.getItem(PRIVACY_MODE_STORAGE_KEY)).toBeNull();
  });

  it("opens with Privacy mode on when it was stored as on, in Spanish too", () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderSettings();

    expect(
      screen.getByRole("switch", { name: /^Modo privacidad/ }),
    ).toBeChecked();
  });

  it("shows the current theme in its row between Currency and Privacy mode", () => {
    renderSettings();

    expect(screen.getByRole("button", { name: "Theme: Midnight Gold" })).toHaveTextContent(
      "Midnight Gold",
    );
    const labels = screen
      .getAllByRole("button", { name: /^(Currency|Theme|Language)/ })
      .map((row) => row.textContent);
    expect(labels).toEqual([
      expect.stringContaining("Language"),
      expect.stringContaining("Currency"),
      expect.stringContaining("Theme"),
    ]);
  });

  it("keeps the Theme sheet open after a pick and returns focus to its row on close", async () => {
    renderSettings();

    await userEvent.click(screen.getByRole("button", { name: /^Theme/ }));
    await userEvent.click(screen.getByRole("radio", { name: "Snowglobe" }));

    expect(screen.getByRole("dialog", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Snowglobe" })).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const row = screen.getByRole("button", { name: "Theme: Snowglobe" });
    expect(row).toHaveFocus();
  });
});
