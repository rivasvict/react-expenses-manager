import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CurrencyTileGrid from ".";

describe("CurrencyTileGrid", () => {
  it("marks the current currency and names each tile by its full name", () => {
    render(<CurrencyTileGrid current="EUR" onPick={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(12);
    expect(screen.getByRole("radio", { name: "Euro" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "US Dollar" })).not.toBeChecked();
  });

  it("reports a pick without deciding what to do with it", async () => {
    const onPick = jest.fn();
    render(<CurrencyTileGrid current="USD" onPick={onPick} columns={4} />);
    await userEvent.click(screen.getByRole("radio", { name: "Euro" }));
    expect(onPick).toHaveBeenCalledWith("EUR");
  });
});
