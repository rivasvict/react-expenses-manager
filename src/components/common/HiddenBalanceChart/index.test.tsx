import React from "react";
import { render, screen } from "@testing-library/react";
import HiddenBalanceChart from "./index";

describe("HiddenBalanceChart", () => {
  it("is a labelled ring with the legend", () => {
    render(<HiddenBalanceChart />);

    expect(screen.getByRole("img", { name: "Chart hidden" })).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("Savings")).toBeInTheDocument();
  });
});
