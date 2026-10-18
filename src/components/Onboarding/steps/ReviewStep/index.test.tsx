import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  addOwnCategory,
  createWizardDraft,
  setBucketLimit,
  toggleCategory,
} from "../../../../onboarding/wizardDraft";
import ReviewStep from ".";

const empty = () => createWizardDraft({ currency: "USD", privacyMode: false });

describe("ReviewStep", () => {
  it("says so when nothing was chosen", () => {
    render(<ReviewStep draft={empty()} onEdit={() => {}} />);
    expect(screen.getByText("English · $ USD")).toBeInTheDocument();
    expect(screen.getByText("Privacy mode off")).toBeInTheDocument();
    expect(screen.getByText("No expense categories")).toBeInTheDocument();
    expect(screen.getByText("No income categories")).toBeInTheDocument();
    expect(screen.getByText("No buckets")).toBeInTheDocument();
  });

  it("summarises the choices, the own names and the monthly total", () => {
    let draft = toggleCategory(empty(), "expense", "Food");
    draft = addOwnCategory(draft, "expense", "Pet food").draft;
    draft = setBucketLimit(draft, "Food", "450");
    draft = setBucketLimit(draft, "Pet food", "30.5");
    render(<ReviewStep draft={{ ...draft, currency: "EUR", privacyMode: true }} onEdit={() => {}} />);

    expect(screen.getByText("English · € EUR")).toBeInTheDocument();
    expect(screen.getByText("Privacy mode on")).toBeInTheDocument();
    expect(screen.getByText("2 expense categories")).toBeInTheDocument();
    expect(screen.getByText("Your own: Pet food")).toBeInTheDocument();
    expect(screen.getByText("2 buckets")).toBeInTheDocument();
    expect(screen.getByText("€480.50 a month in total")).toBeInTheDocument();
  });

  it("sends each Edit to its section", async () => {
    const onEdit = jest.fn();
    render(<ReviewStep draft={empty()} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit No income categories" }));
    await userEvent.click(screen.getByRole("button", { name: "Edit No buckets" }));
    expect(onEdit).toHaveBeenNthCalledWith(1, "income");
    expect(onEdit).toHaveBeenNthCalledWith(2, "buckets");
  });
});
