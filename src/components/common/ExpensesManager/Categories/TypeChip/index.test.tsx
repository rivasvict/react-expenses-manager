/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   the markup under test is decorative (aria-hidden), so it has no role or
   text for Testing Library queries to find. */
import React from "react";
import { render } from "@testing-library/react";
import TypeChip from ".";

describe("TypeChip", () => {
  it.each(["expense", "income"] as const)("tints a decorative chip for %s", (type) => {
    const { container } = render(<TypeChip type={type} />);
    expect(container.firstChild).toHaveClass(`type-chip type-chip--${type}`);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
