import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SettingsChip from "./index";
import { LanguageProvider } from "../../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../../i18n/languagePreference";

const renderChip = () =>
  render(
    <LanguageProvider>
      <MemoryRouter>
        <SettingsChip />
      </MemoryRouter>
    </LanguageProvider>
  );

describe("SettingsChip", () => {
  beforeEach(() => localStorage.clear());

  it("links to /settings with an English label by default", () => {
    renderChip();

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
  });

  it("labels itself in the stored language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderChip();

    expect(screen.getByRole("link", { name: "Ajustes" })).toBeInTheDocument();
  });
});
