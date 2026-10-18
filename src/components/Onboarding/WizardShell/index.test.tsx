import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WizardShell from ".";

const renderShell = (props = {}) => {
  const handlers = { onNext: jest.fn(), onBack: jest.fn(), onSkip: jest.fn() };
  render(
    <WizardShell
      step={2}
      total={5}
      title="What do you spend on?"
      nextLabel="Next"
      summary="8 selected"
      {...handlers}
      {...props}
    >
      <p>Step content</p>
    </WizardShell>
  );
  return handlers;
};

describe("WizardShell", () => {
  it("shows the title, the content, the step and the summary", () => {
    renderShell();
    expect(screen.getByRole("heading", { name: "What do you spend on?" })).toBeInTheDocument();
    expect(screen.getByText("Step content")).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("8 selected")).toBeInTheDocument();
  });

  it("focuses the heading when it mounts", () => {
    renderShell();
    expect(screen.getByRole("heading", { name: "What do you spend on?" })).toHaveFocus();
  });

  it("wires Back, the primary action and Skip setup", async () => {
    const { onNext, onBack, onSkip } = renderShell();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Skip setup" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("hides the footer while a text field is focused and shows it again after", async () => {
    render(
      <WizardShell step={2} total={5} title="T" nextLabel="Next" onNext={() => {}} onSkip={() => {}}>
        <input type="text" aria-label="Field" />
        <button type="button">Elsewhere</button>
      </WizardShell>
    );
    const shell = screen.getByRole("main");
    await userEvent.click(screen.getByRole("textbox", { name: "Field" }));
    expect(shell).toHaveClass("wizard-shell--typing");
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(shell).not.toHaveClass("wizard-shell--typing");
  });

  it("has no Back on the first step and no summary line when none is given", () => {
    renderShell({ step: 1, onBack: undefined, summary: undefined });
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.queryByText("8 selected")).not.toBeInTheDocument();
  });
});
