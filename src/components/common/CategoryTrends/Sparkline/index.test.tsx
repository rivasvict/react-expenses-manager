/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   the marks are decorative SVG with no role; their classes are what they draw. */
import React from "react";
import { render } from "@testing-library/react";
import Sparkline from ".";

const pointsOf = (container: HTMLElement) =>
  container.querySelector("polyline")!.getAttribute("points")!.split(" ");

describe("Sparkline", () => {
  it("draws one point per month, tinted by tone", () => {
    const { container } = render(<Sparkline values={[380, 420, 540]} tone="bad" />);
    expect(pointsOf(container)).toHaveLength(3);
    expect(container.querySelector("svg")).toHaveClass("sparkline--bad");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("draws a flat series across the middle", () => {
    const { container } = render(<Sparkline values={[50, 50]} tone="flat" />);
    expect(pointsOf(container).map((point) => point.split(",")[1])).toEqual(["13.0", "13.0"]);
  });
});
