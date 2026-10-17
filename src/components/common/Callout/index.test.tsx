/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   the markup under test is decorative (aria-hidden), so it has no role or
   text for Testing Library queries to find. */
import React from "react";
import { render, screen } from "@testing-library/react";
import Callout from ".";

describe("Callout", () => {
  it.each(["warn", "danger"] as const)("renders a %s note with its text", (tone) => {
    const { container } = render(<Callout tone={tone}>Mind this</Callout>);
    expect(screen.getByText("Mind this")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(`callout callout--${tone}`);
  });

  it("draws a circle for danger and a triangle for a warning, hidden from assistive tech", () => {
    const { container, rerender } = render(<Callout tone="danger">x</Callout>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("circle")).toBeInTheDocument();
    rerender(<Callout tone="warn">x</Callout>);
    expect(container.querySelector("circle")).not.toBeInTheDocument();
  });
});
