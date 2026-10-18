import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectableChip from ".";

describe("SelectableChip", () => {
  it("shows its label and reports whether it is selected", () => {
    const { rerender } = render(
      <SelectableChip label="Eating out" selected={false} onToggle={() => {}} />
    );
    expect(screen.getByRole("button", { name: "Eating out" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    rerender(<SelectableChip label="Eating out" selected onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: "Eating out" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("calls onToggle when tapped", async () => {
    const onToggle = jest.fn();
    render(<SelectableChip label="Food" selected={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("button", { name: "Food" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
