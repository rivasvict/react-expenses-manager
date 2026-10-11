import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Settings from "./index";
import { LanguageProvider } from "../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/languagePreference";
import {
  CURRENCY_STORAGE_KEY,
  getStoredCurrency,
} from "../../helpers/currency/currency";

const renderSettings = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
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
});
