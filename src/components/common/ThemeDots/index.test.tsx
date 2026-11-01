import React from "react";
import { render, screen } from "@testing-library/react";
import ThemeDots from "./index";
import { getTheme } from "../../../themes";

describe("ThemeDots", () => {
  it("is scoped to its theme's colors and hidden from assistive technology", () => {
    render(<ThemeDots theme={getTheme("gruvbox")} />);
    const dots = screen.getByTestId("theme-dots");
    expect(dots).toHaveAttribute("data-theme", "gruvbox");
    expect(dots).toHaveAttribute("aria-hidden", "true");
  });
});
