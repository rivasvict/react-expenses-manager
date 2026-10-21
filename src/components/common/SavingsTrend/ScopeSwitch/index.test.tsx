import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, MemoryRouter } from "react-router-dom";
import ScopeSwitch, { TrendScope } from ".";
import { LanguageProvider } from "../../../../i18n";

afterEach(() => localStorage.clear());

const renderSwitch = (active: TrendScope) => {
  let path = "";
  render(
    <LanguageProvider>
      <MemoryRouter initialEntries={["/start"]}>
        <ScopeSwitch active={active} />
        <Route path="*" render={({ location }) => { path = location.pathname; return null; }} />
      </MemoryRouter>
    </LanguageProvider>
  );
  return { path: () => path };
};

describe("ScopeSwitch", () => {
  it("lists Savings then Categories and marks the active one", () => {
    renderSwitch("savings");
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Savings", "Categories"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tablist", { name: "Trend of" })).toBeInTheDocument();
  });

  it("opens the view of the tab tapped", async () => {
    const { path } = renderSwitch("savings");
    await userEvent.click(screen.getByRole("tab", { name: "Categories" }));
    expect(path()).toBe("/category-trends");
  });

  it("moves with the arrow keys", async () => {
    const { path } = renderSwitch("categories");
    screen.getByRole("tab", { name: "Categories" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(path()).toBe("/savings-trend");
    expect(screen.getByRole("tab", { name: "Savings" })).toHaveFocus();
  });
});
