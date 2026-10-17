import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteUnusedSheet from ".";

describe("DeleteUnusedSheet", () => {
  it("confirms the deletion of an unused category", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<DeleteUnusedSheet name="Travel" onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getByRole("alertdialog", { name: "Delete “Travel”?" })).toBeInTheDocument();
    expect(
      screen.getByText(/No entries use this category, so nothing else changes/)
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete category" }));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("cancels without deleting", async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(<DeleteUnusedSheet name="Travel" onConfirm={onConfirm} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
