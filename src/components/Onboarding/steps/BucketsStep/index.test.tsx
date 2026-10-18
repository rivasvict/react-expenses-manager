import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createWizardDraft,
  toggleCategory,
  WizardDraft,
} from "../../../../onboarding/wizardDraft";
import BucketsStep from ".";

const Harness = ({
  chosen = [],
  errors = {},
}: {
  chosen?: string[];
  errors?: Record<string, string>;
}) => {
  const [draft, setDraft] = useState<WizardDraft>(() =>
    chosen.reduce(
      (current, name) => toggleCategory(current, "expense", name),
      createWizardDraft({ currency: "USD", privacyMode: false })
    )
  );
  return <BucketsStep draft={draft} errors={errors} onDraftChange={setDraft} />;
};

describe("BucketsStep", () => {
  it("explains there is nothing to budget when no expense category is chosen", () => {
    render(<Harness />);
    expect(screen.getByText("No expense categories to budget")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("lists a row for each chosen expense category", () => {
    render(<Harness chosen={["Food", "Gas"]} />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "Gas" })).not.toBeChecked();
  });

  it("ticks a row when a limit is typed and unticks it when cleared", async () => {
    render(<Harness chosen={["Food"]} />);
    const field = screen.getByRole("textbox", { name: "Monthly limit for Food" });
    await userEvent.type(field, "40");
    expect(screen.getByRole("checkbox", { name: "Food" })).toBeChecked();
    await userEvent.clear(field);
    expect(screen.getByRole("checkbox", { name: "Food" })).not.toBeChecked();
  });

  it("shows the error it is given under its row", () => {
    render(<Harness chosen={["Food"]} errors={{ Food: "Allowance must be greater than zero" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Allowance must be greater than zero");
  });
});
