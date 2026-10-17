import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteSheet from ".";

const at = (iso: string) => new Date(iso).getTime();
const entries = [
  { id: "e1", fixed: false, description: "Sushi with Ana", amount: "64.50", date: at("2026-10-12T12:00:00"), type: "expense" as const },
  { id: "e2", fixed: false, description: "Tacos", amount: "21.40", date: at("2026-09-09T12:00:00"), type: "expense" as const },
];

const renderSheet = (bucketLimit?: number) => {
  const onConfirm = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(
    <DeleteSheet
      type="expense"
      name="Eating out"
      entries={entries}
      bucketLimit={bucketLimit}
      options={["Food", "Travel"]}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  return { onConfirm, onClose };
};

const deleteButton = () =>
  screen.getByRole("button", { name: "Delete and move 2 expenses" });

describe("DeleteSheet", () => {
  it("warns, groups the entries by month and blocks Delete until each has a category", async () => {
    const { onConfirm } = renderSheet(400);

    expect(screen.getByRole("alertdialog", { name: "Delete “Eating out”?" })).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "This can’t be undone. It changes your existing data: 2 expenses move to the categories you pick below, and the $400.00 bucket is removed."
    );
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "October 20261",
      "September 20261",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent("2 expenses still need a category.");
    expect(deleteButton()).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(deleteButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("applies one category to all, then lets a row change, and deletes with those moves", async () => {
    const { onConfirm, onClose } = renderSheet();
    const applyAll = screen.getByRole("button", { name: "Apply to all" });
    expect(applyAll).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(screen.getByRole("combobox", { name: "Set every expense to" }));
    await userEvent.click(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Food" })
    );
    await userEvent.click(applyAll);

    expect(screen.getByRole("combobox", { name: "Category for Tacos" })).toHaveValue("Food");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Category for Tacos" }),
      "Travel"
    );

    expect(deleteButton()).toHaveAttribute("aria-disabled", "false");
    await userEvent.click(deleteButton());
    expect(onConfirm).toHaveBeenCalledWith({ e1: "Food", e2: "Travel" });
    expect(onClose).toHaveBeenCalled();
  });

  it("counts down as rows are assigned one by one", async () => {
    renderSheet();
    const sheet = screen.getByRole("alertdialog");
    await userEvent.selectOptions(
      within(sheet).getByRole("combobox", { name: "Category for Sushi with Ana" }),
      "Food"
    );
    expect(screen.getByRole("status")).toHaveTextContent("1 expense still needs a category.");
  });
});
