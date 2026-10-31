import React from "react";
import { render, screen } from "@testing-library/react";
import CategoryLocation from ".";

describe("CategoryLocation", () => {
  it("holds its children in one group", () => {
    render(
      <CategoryLocation>
        <a href="/category-trends">All categories</a>
        <button type="button">Eating out</button>
      </CategoryLocation>
    );
    expect(screen.getByRole("link", { name: "All categories" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eating out" })).toBeInTheDocument();
  });
});
