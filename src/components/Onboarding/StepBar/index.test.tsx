import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepBar from ".";

describe("StepBar", () => {
  it("names the step and exposes the progress", () => {
    render(<StepBar step={2} total={5} onSkip={() => {}} />);
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Step 2 of 5" })).toHaveAttribute(
      "aria-valuenow",
      "2"
    );
  });

  it("offers Skip setup", async () => {
    const onSkip = jest.fn();
    render(<StepBar step={1} total={5} onSkip={onSkip} />);
    await userEvent.click(screen.getByRole("button", { name: "Skip setup" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
