import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ViewTabs from ".";
import { LanguageProvider } from "../../../../i18n";

afterEach(() => localStorage.clear());

const renderTabs = (active: "total" | "change" = "total") => {
  const onChange = jest.fn();
  render(
    <LanguageProvider>
      <ViewTabs active={active} onChange={onChange} />
    </LanguageProvider>
  );
  return { onChange };
};

describe("ViewTabs", () => {
  it("lists Total saved on the left and Change on the right", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Total saved", "Change"]);
  });

  it("marks the active tab as selected", () => {
    renderTabs("change");
    expect(screen.getByRole("tab", { name: "Change" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Total saved" })).toHaveAttribute("aria-selected", "false");
  });

  it("reports the tab that was clicked", async () => {
    const { onChange } = renderTabs();
    await userEvent.click(screen.getByRole("tab", { name: "Change" }));
    expect(onChange).toHaveBeenCalledWith("change");
  });

  it("moves between tabs with the arrow keys", async () => {
    const { onChange } = renderTabs("total");
    screen.getByRole("tab", { name: "Total saved" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("change");
    await userEvent.keyboard("{ArrowLeft}");
    expect(onChange).toHaveBeenLastCalledWith("total");
  });

  it("names the group Show", () => {
    renderTabs();
    expect(screen.getByRole("tablist", { name: "Show" })).toBeInTheDocument();
  });
});
