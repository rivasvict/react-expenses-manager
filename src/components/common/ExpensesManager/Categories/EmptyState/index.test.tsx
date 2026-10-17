import React from "react";
import { render, screen } from "@testing-library/react";
import EmptyState from ".";

describe("EmptyState", () => {
  it("explains an empty income list", () => {
    render(<EmptyState type="income" />);
    expect(
      screen.getByRole("heading", { name: "No income categories yet" })
    ).toBeInTheDocument();
    expect(screen.getByText(/where your money comes from/)).toBeInTheDocument();
  });

  it("explains an empty expense list", () => {
    render(<EmptyState type="expense" />);
    expect(
      screen.getByRole("heading", { name: "No expense categories yet" })
    ).toBeInTheDocument();
  });
});
