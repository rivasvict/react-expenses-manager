import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeCard from "./index";
import { getTheme } from "../../../themes";

describe("ThemeCard", () => {
  it("is a radio named by the theme, described by what inspired it", () => {
    render(
      <ThemeCard theme={getTheme("all-hallows")} selected={false} onSelect={jest.fn()} />,
    );
    const radio = screen.getByRole("radio", { name: "All Hallows" });
    expect(radio).toHaveAttribute("aria-checked", "false");
    expect(radio).toHaveAccessibleDescription("Inspired by Halloween");
  });

  it("marks the default theme with a badge and the original look", () => {
    render(
      <ThemeCard theme={getTheme("midnight-gold")} selected onSelect={jest.fn()} />,
    );
    const radio = screen.getByRole("radio", { name: "Midnight Gold" });
    expect(radio).toHaveAttribute("aria-checked", "true");
    expect(radio).toHaveTextContent("Default");
    expect(radio).toHaveAccessibleDescription("The original look");
  });

  it("shows a tick only while selected", () => {
    const { rerender } = render(
      <ThemeCard theme={getTheme("nord")} selected={false} onSelect={jest.fn()} />,
    );
    expect(screen.queryByTestId("theme-card-tick")).not.toBeInTheDocument();
    rerender(<ThemeCard theme={getTheme("nord")} selected onSelect={jest.fn()} />);
    expect(screen.getByTestId("theme-card-tick")).toBeInTheDocument();
  });

  it("selects on tap", async () => {
    const onSelect = jest.fn();
    render(<ThemeCard theme={getTheme("nord")} selected={false} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("radio", { name: "Nord" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
