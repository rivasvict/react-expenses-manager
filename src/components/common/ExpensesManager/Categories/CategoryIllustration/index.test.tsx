/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   the markup under test is decorative (aria-hidden), so it has no role or
   text for Testing Library queries to find. */
import React from "react";
import { render } from "@testing-library/react";
import CategoryIllustration from ".";

describe("CategoryIllustration", () => {
  it("is a decorative svg painted through classes (tokens), not inline colors", () => {
    const { container } = render(<CategoryIllustration />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.innerHTML).not.toMatch(/fill="#|stroke="#/);
  });
});
