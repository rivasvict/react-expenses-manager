import React from "react";
import { render, screen } from "@testing-library/react";
import Trans from "./index";
import { LanguageProvider } from "../LanguageProvider";
import { LANGUAGE_STORAGE_KEY } from "../languagePreference";

const renderTrans = () =>
  render(
    <LanguageProvider>
      <p data-testid="sentence">
        <Trans
          i18nKey="addBucket.noCategories"
          components={{ link: (label) => <a href="/add-category">{label}</a> }}
        />
      </p>
    </LanguageProvider>
  );

describe("Trans", () => {
  beforeEach(() => localStorage.clear());

  it("renders the tagged span through its component", () => {
    renderTrans();
    expect(
      screen.getByRole("link", { name: "Add a new category" })
    ).toHaveAttribute("href", "/add-category");
    expect(screen.getByTestId("sentence")).toHaveTextContent(
      "Every category already has a bucket. Add a new category first."
    );
  });

  it("places the span where the translation puts it", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderTrans();
    expect(
      screen.getByRole("link", { name: "añade una categoría nueva" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("sentence")).toHaveTextContent(
      "Todas las categorías ya tienen un límite. Primero añade una categoría nueva."
    );
  });
});
