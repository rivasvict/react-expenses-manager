import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "./index";
import { THEME_STORAGE_KEY } from "../themePreference";

const Probe = () => {
  const { theme, themes, setTheme } = useTheme();
  return (
    <>
      <p>{`theme:${theme.id} count:${themes.length}`}</p>
      <button onClick={() => setTheme("nord")}>pick nord</button>
    </>
  );
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("starts on the default theme and themes the document", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByText("theme:midnight-gold count:15")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("midnight-gold");
  });

  it("starts on the stored theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "gruvbox");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    expect(screen.getByText(/theme:gruvbox/)).toBeInTheDocument();
  });

  it("stores, applies and shows a picked theme", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    await user.click(screen.getByRole("button", { name: "pick nord" }));
    expect(screen.getByText(/theme:nord/)).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("nord");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("nord");
  });

  it("follows a change made in another tab", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    localStorage.setItem(THEME_STORAGE_KEY, "tokyo-night");
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: THEME_STORAGE_KEY })
      );
    });
    expect(screen.getByText(/theme:tokyo-night/)).toBeInTheDocument();
  });

  it("gives the default theme to a component without a provider", () => {
    render(<Probe />);
    expect(screen.getByText(/theme:midnight-gold/)).toBeInTheDocument();
  });
});
