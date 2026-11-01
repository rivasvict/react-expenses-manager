import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeSheet from "./index";
import { ThemeProvider } from "../../../themes";

const renderSheet = (onClose: () => void) => {
  localStorage.clear();
  render(
    <ThemeProvider>
      <ThemeSheet onClose={onClose} />
    </ThemeProvider>,
  );
};

describe("ThemeSheet", () => {
  it("lists every theme with the current one checked", () => {
    renderSheet(jest.fn());
    expect(screen.getByRole("dialog", { name: "Theme" })).toBeInTheDocument();
    expect(
      screen.getByText("Tap a theme to use it. The app changes right away."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(15);
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).toBeChecked();
  });

  it("applies a tapped theme and stays open", async () => {
    const onClose = jest.fn();
    renderSheet(onClose);
    await userEvent.click(screen.getByRole("radio", { name: "Nord" }));
    expect(screen.getByRole("radio", { name: "Nord" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).not.toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("nord");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes with the Close button", async () => {
    const onClose = jest.fn();
    renderSheet(onClose);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
