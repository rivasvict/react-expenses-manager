import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Settings from "./index";
import { LanguageProvider } from "../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../i18n/languagePreference";

const renderSettings = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </LanguageProvider>
  );

describe("Settings", () => {
  beforeEach(() => localStorage.clear());

  it("offers every language by its own name, with English selected by default", () => {
    renderSettings();

    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /English/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Español/ })).not.toBeChecked();
    // The other language carries a gloss in the current one.
    expect(screen.getByText("Spanish")).toBeInTheDocument();
  });

  it("switches the whole screen to the picked language", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole("radio", { name: /Español/ }));

    expect(screen.getByRole("radio", { name: /Español/ })).toBeChecked();
    expect(screen.getByRole("group", { name: "Idioma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
    expect(screen.getByText("Inglés")).toBeInTheDocument();
  });

  it("opens on the stored language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderSettings();

    expect(screen.getByRole("radio", { name: /Español/ })).toBeChecked();
    expect(screen.getByText("Ajustes")).toBeInTheDocument();
  });
});
