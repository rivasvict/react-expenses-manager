import React from "react";
import { render, screen } from "@testing-library/react";
import ChartTooltip from ".";

describe("ChartTooltip", () => {
  it("shows the month, its savings and how it compares", () => {
    render(
      <ChartTooltip
        title="July 2026"
        amount="$1,390.00"
        comparison={{ text: "+$110.00 vs Apr", tone: "up" }}
        share={50}
        anchor="left"
      />
    );
    expect(screen.getByText("July 2026")).toBeInTheDocument();
    expect(screen.getByText("+$110.00 vs Apr")).toHaveClass("chart-tooltip__comparison--up");
  });

  it("has no comparison line for the reference month", () => {
    render(<ChartTooltip title="April 2026" amount="$1,280.00" share={0} anchor="left" />);
    expect(screen.queryByText(/vs/)).not.toBeInTheDocument();
  });

  it("opens to the right of a left-anchored point and to the left of a right-anchored one", () => {
    const { rerender } = render(<ChartTooltip title="A" amount="$1.00" share={25} anchor="left" />);
    const tooltip = screen.getByTestId("chart-tooltip");
    expect(tooltip.style.left).toBe("calc(25.0% - 0.2rem)");
    expect(tooltip.style.right).toBe("");

    rerender(<ChartTooltip title="A" amount="$1.00" share={75} anchor="right" />);
    expect(tooltip.style.right).toBe("calc(25.0% - 0.2rem)");
    expect(tooltip.style.left).toBe("");
  });
});
