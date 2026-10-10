import React from "react";
import { render, screen } from "@testing-library/react";
import ChangePill from ".";

describe("ChangePill", () => {
  it("signs a rise with a plus", () => {
    render(<ChangePill kind="up" percent="12.5%" />);
    expect(screen.getByText("+12.5%")).toHaveClass("change-pill--up");
  });

  it("signs a drop with a true minus", () => {
    render(<ChangePill kind="down" percent="12.5%" />);
    expect(screen.getByText("−12.5%")).toHaveClass("change-pill--down");
  });

  it("shows no sign when nothing changed", () => {
    render(<ChangePill kind="flat" percent="0.0%" />);
    expect(screen.getByText("0.0%")).toHaveClass("change-pill--flat");
  });

  it("can be hidden from assistive tech when a parent speaks for it", () => {
    render(<ChangePill kind="up" percent="1.0%" aria-hidden />);
    expect(screen.getByText("+1.0%")).toHaveAttribute("aria-hidden", "true");
  });
});
