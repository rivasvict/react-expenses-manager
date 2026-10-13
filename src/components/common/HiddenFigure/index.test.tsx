import React from "react";
import { render, screen } from "@testing-library/react";
import HiddenFigure from "./index";

describe("HiddenFigure", () => {
  it("is announced by its label, not by the placeholder", () => {
    render(<HiddenFigure placeholder="$8,888.88" label="Amount hidden" />);

    expect(screen.getByRole("img", { name: "Amount hidden" })).toBeInTheDocument();
    expect(screen.getByText("$8,888.88")).toHaveAttribute("aria-hidden", "true");
  });

  it("adds the caller's class", () => {
    render(
      <HiddenFigure placeholder="+8.8%" label="Hidden" className="extra" />
    );

    expect(screen.getByRole("img", { name: "Hidden" })).toHaveClass(
      "hidden-figure",
      "extra"
    );
  });
});
