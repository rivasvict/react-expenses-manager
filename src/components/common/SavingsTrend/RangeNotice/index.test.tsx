import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RangeNotice from ".";
import { LanguageProvider } from "../../../../i18n";
import type { TrendRangeState } from "../TrendRangeContext";

afterEach(() => localStorage.clear());

const renderNotice = (resolved: TrendRangeState["resolved"]) => {
  const setPicked = jest.fn();
  const { container } = render(
    <LanguageProvider>
      <RangeNotice range={{ requested: { kind: "preset", id: "6M" }, resolved, setPicked }} />
    </LanguageProvider>
  );
  return { setPicked, container };
};

describe("RangeNotice", () => {
  it("offers to compare with the first recorded month when the range reaches before it", async () => {
    const { setPicked } = renderNotice({
      status: "short",
      monthsBack: 2,
      earliest: { year: 2026, month: 7 },
    });
    expect(screen.getByText("Not enough history for this range")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /august 2026/i }));
    expect(setPicked).toHaveBeenCalledWith({ kind: "custom", monthsBack: 2 });
  });

  it("explains that there is no earlier month yet", () => {
    renderNotice({ status: "empty" });
    expect(screen.getByText("Not enough history yet")).toBeInTheDocument();
  });

  it("shows nothing for a range that is ready", () => {
    const { container } = renderNotice({ status: "ready", monthsBack: 6 });
    expect(container).toBeEmptyDOMElement();
  });
});
