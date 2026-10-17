import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteBlockedSheet from ".";

describe("DeleteBlockedSheet", () => {
  it("explains why the only category of a type cannot go and offers to add another", async () => {
    const onAddCategory = jest.fn();
    const onClose = jest.fn();
    render(
      <DeleteBlockedSheet
        type="income"
        name="Salary"
        count={2}
        onAddCategory={onAddCategory}
        onClose={onClose}
      />
    );

    expect(
      screen.getByRole("alertdialog", { name: "Can’t delete “Salary” yet" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "2 incomes use Salary and it is your only income category, so there is nowhere to move them. Add another income category first, then delete this one."
      )
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Add income category" }));
    expect(onAddCategory).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
