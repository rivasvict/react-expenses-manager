import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategorySheet from ".";

const categoryLists = { expense: ["Eating out", "Food", "Travel"], income: ["Salary"] };
const usage = (count: number, total = 0) => ({ count, total, entries: [] });

const renderSheet = (props: Partial<React.ComponentProps<typeof CategorySheet>> = {}) => {
  const handlers = {
    onSave: jest.fn().mockResolvedValue(undefined),
    onDelete: jest.fn(),
    onClose: jest.fn(),
  };
  render(
    <CategorySheet
      type="expense"
      name="Eating out"
      usage={usage(5, 275.95)}
      bucketLimit={400}
      categoryLists={categoryLists}
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe("CategorySheet", () => {
  it("shows the type, name, usage figures and the impact of a rename", () => {
    renderSheet();
    expect(
      screen.getByRole("dialog", { name: "Expense category Eating out" })
    ).toBeInTheDocument();
    expect(screen.getByText("$275.95")).toBeInTheDocument();
    expect(screen.getByText("bucket / mo")).toBeInTheDocument();
    expect(
      screen.getByText(/the \$400.00 bucket from “Eating out” to the new name/)
    ).toHaveTextContent(
      "Saving changes 5 existing expenses and the $400.00 bucket from “Eating out” to the new name. Synced devices get the change too."
    );
    expect(screen.getByText("5 existing expenses").tagName).toBe("B");
    expect(
      screen.getByText("Deleting asks you where its 5 expenses should go.")
    ).toBeInTheDocument();
  });

  it("leaves the impact note out for an unused category without a bucket", () => {
    renderSheet({ name: "Travel", usage: usage(0), bucketLimit: undefined });
    expect(screen.queryByText(/Saving changes/)).not.toBeInTheDocument();
    expect(screen.getByText("no bucket")).toBeInTheDocument();
    expect(screen.getByText("No entries use this category.")).toBeInTheDocument();
  });

  it("words an income category's note without a bucket", () => {
    renderSheet({
      type: "income",
      name: "Salary",
      usage: usage(1),
      bucketLimit: undefined,
    });
    expect(screen.getByText(/existing income/)).toHaveTextContent("1 existing income");
  });

  it("saves a new name", async () => {
    const { onSave, onClose } = renderSheet();
    const field = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(field);
    await userEvent.type(field, "Restaurants ");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSave).toHaveBeenCalledWith("Restaurants");
    expect(onClose).toHaveBeenCalled();
  });

  it("just closes when the name did not change", async () => {
    const { onSave, onClose } = renderSheet();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("refuses a name another expense category has", async () => {
    const { onSave } = renderSheet();
    const field = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(field);
    await userEvent.type(field, "Food");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "An expense category called “Food” already exists."
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("hands over to the delete flow", async () => {
    const { onDelete } = renderSheet();
    await userEvent.click(screen.getByRole("button", { name: "Delete category" }));
    expect(onDelete).toHaveBeenCalled();
  });
});
