import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UnderlineTabs from ".";

const renderTabs = (active: "a" | "b" | "c" = "a") => {
  const onChange = jest.fn();
  render(
    <UnderlineTabs
      ariaLabel="Pick one"
      tabs={[
        { id: "a", label: "Alpha", badge: 5 },
        { id: "b", label: "Beta", badge: 0 },
        { id: "c", label: "Gamma" },
      ]}
      active={active}
      onChange={onChange}
    />
  );
  return { onChange };
};

describe("UnderlineTabs", () => {
  it("is a named tablist whose tabs carry their badges", () => {
    renderTabs();
    expect(screen.getByRole("tablist", { name: "Pick one" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Alpha5",
      "Beta0",
      "Gamma",
    ]);
  });

  it("selects and focuses only the active tab", () => {
    renderTabs("b");
    expect(screen.getByRole("tab", { name: /Beta/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Beta/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: /Alpha/ })).toHaveAttribute("tabindex", "-1");
  });

  it("reports a click and moves with the arrow, Home and End keys", async () => {
    const { onChange } = renderTabs("a");
    await userEvent.click(screen.getByRole("tab", { name: /Beta/ }));
    expect(onChange).toHaveBeenLastCalledWith("b");

    screen.getByRole("tab", { name: /Alpha/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("b");
    await userEvent.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith("c");
    await userEvent.keyboard("{Home}");
    expect(onChange).toHaveBeenLastCalledWith("a");
  });
});
