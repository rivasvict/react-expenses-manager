import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Router } from "react-router-dom";
import { createMemoryHistory, LocationDescriptor } from "history";
import ScopeSwitch, { TrendScope } from ".";
import { LanguageProvider } from "../../../../i18n";

afterEach(() => localStorage.clear());

const showSwitch = (active: TrendScope, start: LocationDescriptor = "/start") => {
  const history = createMemoryHistory({ initialEntries: [start] });
  render(
    <LanguageProvider>
      <Router history={history}>
        <ScopeSwitch active={active} />
      </Router>
    </LanguageProvider>
  );
  return history;
};

describe("ScopeSwitch", () => {
  it("lists Savings then Categories and marks the active one", () => {
    showSwitch("savings");
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Savings", "Categories"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tablist", { name: "Trend of" })).toBeInTheDocument();
  });

  it("opens the view of the tab tapped", async () => {
    const history = showSwitch("savings");
    await userEvent.click(screen.getByRole("tab", { name: "Categories" }));
    expect(history.location.pathname).toBe("/category-trends");
  });

  it("adds no history entry when the open view is tapped again", async () => {
    const history = showSwitch("savings", "/savings-trend");
    await userEvent.click(screen.getByRole("tab", { name: "Savings" }));
    expect(history.length).toBe(1);
  });

  it("moves with the arrow keys and asks the next view to take focus", async () => {
    const history = showSwitch("categories");
    screen.getByRole("tab", { name: "Categories" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(history.location.pathname).toBe("/savings-trend");
    expect(history.location.state).toEqual({ focusScope: true });
  });

  it("takes focus when its view was opened from the keyboard", () => {
    showSwitch("savings", { pathname: "/savings-trend", state: { focusScope: true } });
    expect(screen.getByRole("tab", { name: "Savings" })).toHaveFocus();
  });

  it("leaves focus alone when its view was opened otherwise", () => {
    showSwitch("savings", "/savings-trend");
    expect(screen.getByRole("tab", { name: "Savings" })).not.toHaveFocus();
  });
});
