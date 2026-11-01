import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeRadioGroup from "./index";
import { THEME_CATALOG } from "../../../themes";

const Harness = () => {
  const [id, setId] = useState(THEME_CATALOG[0].id);
  return (
    <ThemeRadioGroup
      className="x"
      themes={THEME_CATALOG}
      currentId={id}
      onPick={setId}
    />
  );
};

describe("ThemeRadioGroup", () => {
  it("is a radiogroup named Theme with one radio per theme", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: "Theme" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(17);
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).toBeChecked();
  });

  it("keeps only the checked card in the tab order", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).toHaveFocus();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it("moves to the next theme and picks it with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "All Hallows" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "All Hallows" })).toBeChecked();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).toBeChecked();
  });

  it("wraps around and jumps with Home and End", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Yuletide" })).toBeChecked();
    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "Midnight Gold" })).toBeChecked();
    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "Yuletide" })).toBeChecked();
  });
});
