/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   the marks are decorative SVG with no role; their classes are what they draw. */
import React from "react";
import { render } from "@testing-library/react";
import ChartKey from ".";
import { LanguageProvider } from "../../../../../i18n";

afterEach(() => localStorage.clear());

const keyText = (view: "perMonth" | "change", type: "expense" | "income") => {
  const { container } = render(
    <LanguageProvider>
      <ChartKey view={view} type={type} reference="April" />
    </LanguageProvider>
  );
  return Array.from(container.querySelectorAll(".category-trend-chart__key > span")).map((item) => item.textContent);
};

describe("ChartKey", () => {
  it("names the gold line on Per month", () => {
    expect(keyText("perMonth", "income")).toEqual(["Earned that month"]);
  });

  it("lists the reference line, then Less and More on Change", () => {
    expect(keyText("change", "expense")).toEqual(["Spent in April", "Less", "More"]);
  });

  it("keeps the order for an income category", () => {
    expect(keyText("change", "income")).toEqual(["Earned in April", "Less", "More"]);
  });
});
