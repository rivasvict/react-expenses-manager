import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryNoteCard from ".";
import { CategoryChange } from "../../../helpers/categoryChanges/categoryChanges";

const at = (iso: string) => new Date(iso).getTime();
const affected = ["Sushi with Ana", "Pizza night", "Coffee & bagel", "Birthday dinner", "Tacos"].map(
  (description, index) => ({
    id: `e${index}`,
    fixed: false,
    description,
    amount: "10",
    date: at(`2026-10-${String(10 - index).padStart(2, "0")}T12:00:00`),
    type: "expense" as const,
    target: index === 2 ? "Travel" : "Food",
  })
);

const rename: CategoryChange = {
  id: "c1",
  kind: "rename",
  type: "expense",
  name: "Eating out",
  newName: "Restaurants",
  at: at("2026-10-14T12:00:00"),
  by: { id: "u2", name: "Ana" },
};

describe("CategoryNoteCard", () => {
  it("shows a rename with who made it, the first three entries it changes and only Continue", async () => {
    const onContinue = jest.fn();
    render(<CategoryNoteCard change={rename} affected={affected} onContinue={onContinue} />);

    expect(screen.getByText("Category renamed · for your information")).toBeInTheDocument();
    expect(screen.getByText("Eating out")).toBeInTheDocument();
    expect(screen.getByText("Restaurants")).toBeInTheDocument();
    expect(screen.getByText("Expense category · renamed by Ana on Oct 14")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your expenses that change 5" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument();
    expect(screen.getByText("Category changes can’t be rejected.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show 2 more" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(5);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("shows where each entry of a deleted category goes", () => {
    render(
      <CategoryNoteCard
        change={{ ...rename, kind: "delete", newName: undefined, by: undefined }}
        affected={affected.slice(0, 3)}
        onContinue={jest.fn()}
      />
    );

    expect(screen.getByText("Category deleted · for your information")).toBeInTheDocument();
    expect(screen.getByText("Expense category · deleted on Oct 14")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your expenses that move 3" })).toBeInTheDocument();
    expect(screen.getAllByText("→ Food")).toHaveLength(2);
    expect(screen.getByText("→ Travel")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show/ })).not.toBeInTheDocument();
  });

  it("has no list when none of the user's entries change", () => {
    render(<CategoryNoteCard change={rename} affected={[]} onContinue={jest.fn()} />);
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
