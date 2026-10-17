import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AffectedEntryRow from ".";

const entry = {
  id: "e1",
  fixed: false,
  description: "Sushi with Ana",
  amount: "64.50",
  date: new Date("2026-10-12T12:00:00").getTime(),
  type: "expense" as const,
};

describe("AffectedEntryRow", () => {
  it("shows the entry and a select named after it, empty until chosen", async () => {
    const onChange = jest.fn();
    render(
      <AffectedEntryRow entry={entry} options={["Food", "Travel"]} value="" onChange={onChange} />
    );

    expect(screen.getByText("Sushi with Ana")).toBeInTheDocument();
    expect(screen.getByText("Oct 12, 2026 ·", { exact: false })).toHaveTextContent(
      "Oct 12, 2026 · $64.50"
    );
    const select = screen.getByRole("combobox", { name: "Category for Sushi with Ana" });
    expect(select).toHaveValue("");
    expect(select).toHaveClass("affected-entry__select--empty");

    await userEvent.selectOptions(select, "Travel");
    expect(onChange).toHaveBeenCalledWith("Travel");
  });

  it("shows only the amount for a fixed entry", () => {
    render(
      <AffectedEntryRow
        entry={{ ...entry, fixed: true, date: undefined }}
        options={["Food"]}
        value="Food"
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("$64.50")).toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("Food");
  });
});
