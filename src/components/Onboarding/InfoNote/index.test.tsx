import React from "react";
import { render, screen } from "@testing-library/react";
import InfoNote from ".";

describe("InfoNote", () => {
  it("renders its message", () => {
    render(<InfoNote>Starting with none is fine.</InfoNote>);
    expect(screen.getByText("Starting with none is fine.")).toBeInTheDocument();
  });
});
