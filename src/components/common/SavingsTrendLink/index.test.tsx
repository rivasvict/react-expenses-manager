import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SavingsTrendLink from ".";
import { LanguageProvider } from "../../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../../i18n/languagePreference";

const renderLink = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <SavingsTrendLink to="/savings-trend" />
      </MemoryRouter>
    </LanguageProvider>
  );

afterEach(() => localStorage.clear());

describe("SavingsTrendLink", () => {
  it("links to the savings trend screen under its full name", () => {
    renderLink();
    const link = screen.getByRole("link", { name: "Savings trend" });
    expect(link).toHaveAttribute("href", "/savings-trend");
    expect(link).toHaveTextContent("Trend");
  });

  it("is translated", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderLink();
    expect(
      screen.getByRole("link", { name: "Tendencia del ahorro" })
    ).toHaveTextContent("Tendencia");
  });
});
