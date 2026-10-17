import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddCategorySheet from ".";

const categoryLists = { expense: ["Food"], income: ["Salary"] };

const renderSheet = (type: "expense" | "income" = "expense") => {
  const onCreate = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  render(
    <AddCategorySheet
      type={type}
      categoryLists={categoryLists}
      onCreate={onCreate}
      onClose={onClose}
    />
  );
  return { onCreate, onClose };
};

describe("AddCategorySheet", () => {
  it("is titled by type and opens with its name field focused", () => {
    renderSheet("income");
    expect(
      screen.getByRole("dialog", { name: "New income category" })
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
    expect(
      screen.getByText("Names must be unique among your income categories.")
    ).toBeInTheDocument();
  });

  it("creates the trimmed name and closes", async () => {
    const { onCreate, onClose } = renderSheet();
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "  Gym ");
    await userEvent.click(screen.getByRole("button", { name: "Create category" }));
    expect(onCreate).toHaveBeenCalledWith("Gym");
    expect(onClose).toHaveBeenCalled();
  });

  it("refuses a duplicate in the same type and stays open", async () => {
    const { onCreate, onClose } = renderSheet();
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "food");
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An expense category called “food” already exists."
    );
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    expect(onCreate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("says when saving failed", async () => {
    const { onCreate } = renderSheet();
    onCreate.mockRejectedValueOnce(new Error("disk full"));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Gym");
    await userEvent.click(screen.getByRole("button", { name: "Create category" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The category could not be created"
    );
  });
});
