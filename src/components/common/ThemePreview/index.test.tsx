import React from "react";
import { render, screen } from "@testing-library/react";
import ThemePreview from "./index";
import { getTheme } from "../../../themes";

describe("ThemePreview", () => {
  it("is scoped to its theme and hidden from assistive technology", () => {
    render(<ThemePreview theme={getTheme("nord")} />);
    const preview = screen.getByTestId("theme-preview");
    expect(preview).toHaveAttribute("data-theme", "nord");
    expect(preview).toHaveAttribute("aria-hidden", "true");
  });

  it("shows the sample figures in the stored currency", () => {
    render(<ThemePreview theme={getTheme("nord")} />);
    expect(screen.getByText("$1,620.00")).toBeInTheDocument();
    expect(screen.getByText("$4,200.00")).toBeInTheDocument();
    expect(screen.getByText("$2,580.00")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
  });

  it("formats the figures in the currency it is given", () => {
    render(<ThemePreview theme={getTheme("nord")} currency="EUR" />);
    expect(screen.getByText(/€/, { selector: ".theme-preview__figure" })).toBeInTheDocument();
  });
});
