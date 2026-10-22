import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BackLink from ".";

describe("BackLink", () => {
  it("links back to the list", () => {
    render(
      <MemoryRouter>
        <BackLink to="/category-trends" label="All categories" />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: "All categories" })).toHaveAttribute("href", "/category-trends");
  });
});
