import React from "react";
import { render, screen } from "@testing-library/react";
import TotalFigures from ".";
import { LanguageProvider } from "../../../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../../../i18n/languagePreference";

const renderFigures = (props: Partial<React.ComponentProps<typeof TotalFigures>> = {}) =>
  render(
    <LanguageProvider>
      <TotalFigures
        label="Total saved, Apr – Oct"
        total={8720}
        months={7}
        average={8720 / 7}
        {...props}
      />
    </LanguageProvider>
  );

afterEach(() => localStorage.clear());

describe("TotalFigures", () => {
  it("shows the label, the total, the months and the average", () => {
    renderFigures();
    expect(screen.getByText("Total saved, Apr – Oct")).toBeInTheDocument();
    expect(screen.getByText("$8,720.00")).toHaveClass("trend-summary__amount--neutral");
    expect(screen.getByText("7 months · $1,245.71 avg per month")).toBeInTheDocument();
  });

  it("gives a negative total the expense tone and a true minus", () => {
    renderFigures({ total: -1600, months: 3, average: -1600 / 3 });
    expect(screen.getByText("−$1,600.00")).toHaveClass("trend-summary__amount--down");
    expect(screen.getByText("3 months · −$533.33 avg per month")).toBeInTheDocument();
  });

  it("is translated", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderFigures({ label: "Ahorro total, abr – oct" });
    expect(screen.getByText("7 meses · $1,245.71 de media al mes")).toBeInTheDocument();
  });
});
