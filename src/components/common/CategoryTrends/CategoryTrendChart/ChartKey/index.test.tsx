/* eslint-disable testing-library/no-node-access, testing-library/no-container --
   the marks are decorative SVG with no role; their classes are what they draw. */
import React from "react";
import { render } from "@testing-library/react";
import ChartKey from ".";
import { LanguageProvider } from "../../../../../i18n";

afterEach(() => localStorage.clear());

const keyText = (
  view: "perMonth" | "change",
  type: "expense" | "income",
  tone: "good" | "bad" | "flat" = "bad"
) => {
  const { container } = render(
    <LanguageProvider>
      <ChartKey view={view} type={type} tone={tone} reference="April" />
    </LanguageProvider>
  );
  return Array.from(container.querySelectorAll(".category-trend-chart__key > span")).map((item) => item.textContent);
};

describe("ChartKey", () => {
  it("says spending is up when more spent is bad news on Per month", () => {
    expect(keyText("perMonth", "expense", "bad")).toEqual(["Spending is up from April"]);
  });

  it("says spending is down when less spent is good news on Per month", () => {
    expect(keyText("perMonth", "expense", "good")).toEqual(["Spending is down from April"]);
  });

  it("flips the direction for an income category on Per month", () => {
    expect(keyText("perMonth", "income", "good")).toEqual(["Income is up from April"]);
    expect(keyText("perMonth", "income", "bad")).toEqual(["Income is down from April"]);
  });

  it("says nothing changed on Per month", () => {
    expect(keyText("perMonth", "expense", "flat")).toEqual(["Spending is the same as in April"]);
    expect(keyText("perMonth", "income", "flat")).toEqual(["Income is the same as in April"]);
  });

  it("lists the reference line, then Less and More on Change", () => {
    expect(keyText("change", "expense")).toEqual(["Spent in April", "Less", "More"]);
  });

  it("keeps the order for an income category", () => {
    expect(keyText("change", "income")).toEqual(["Earned in April", "Less", "More"]);
  });
});
