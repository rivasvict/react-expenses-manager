import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryType } from "../../../../helpers/categoryLists/categoryLists";
import { createWizardDraft, WizardDraft } from "../../../../onboarding/wizardDraft";
import CategoriesStep from ".";

const Harness = ({ type }: { type: CategoryType }) => {
  const [draft, setDraft] = useState<WizardDraft>(() =>
    createWizardDraft({ currency: "USD", privacyMode: false })
  );
  return <CategoriesStep type={type} draft={draft} onDraftChange={setDraft} />;
};

describe("CategoriesStep", () => {
  it("lists the seed categories of its type, none chosen", () => {
    render(<Harness type="income" />);
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Salary" })).toBeInTheDocument();
    expect(screen.getByText("0 of 3 selected")).toBeInTheDocument();
    expect(screen.getByText(/Starting with none is fine/)).toBeInTheDocument();
  });

  it("toggles a chip and updates the count", async () => {
    render(<Harness type="income" />);
    await userEvent.click(screen.getByRole("button", { name: "Salary" }));
    expect(screen.getByRole("button", { name: "Salary" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 of 3 selected")).toBeInTheDocument();
    expect(screen.queryByText(/Starting with none is fine/)).not.toBeInTheDocument();
  });

  it("adds an own category as a chosen chip and clears the field", async () => {
    render(<Harness type="income" />);
    const field = screen.getByRole("textbox", { name: "Add your own" });
    await userEvent.type(field, "Freelance{enter}");
    expect(screen.getByRole("button", { name: "Freelance" })).toHaveAttribute("aria-pressed", "true");
    expect(field).toHaveValue("");
  });

  it("explains a duplicate and clears the message when the text changes", async () => {
    render(<Harness type="income" />);
    const field = screen.getByRole("textbox", { name: "Add your own" });
    await userEvent.type(field, "salary{enter}");
    expect(screen.getByRole("alert")).toHaveTextContent("An income category called “salary” already exists.");
    await userEvent.type(field, "x");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("selects all and clears everything, own names included", async () => {
    render(<Harness type="income" />);
    await userEvent.type(screen.getByRole("textbox", { name: "Add your own" }), "Freelance{enter}");
    await userEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByText("4 of 4 selected")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("0 of 3 selected")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Freelance" })).not.toBeInTheDocument();
  });
});
