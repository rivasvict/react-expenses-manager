import React from "react";
import { render, screen } from "@testing-library/react";
import UsageFigures from ".";

describe("UsageFigures", () => {
  it("pairs each label with its value", () => {
    render(
      <UsageFigures
        figures={[
          { value: "5", label: "expenses" },
          { value: "$275.95", label: "in total" },
          { value: "—", label: "no bucket" },
        ]}
      />
    );
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual([
      "expenses",
      "in total",
      "no bucket",
    ]);
    expect(screen.getAllByRole("definition").map((value) => value.textContent)).toEqual([
      "5",
      "$275.95",
      "—",
    ]);
  });
});
