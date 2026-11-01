import React from "react";
import { render, screen } from "@testing-library/react";
import { useShrinkToFit } from "./index";

const Label = ({ text }: { text: string }) => {
  const ref = useShrinkToFit<HTMLSpanElement>([text]);
  return (
    <span ref={ref} data-testid="label">
      {text}
    </span>
  );
};

// jsdom has no layout: model a label whose text is 10px wide per px of font.
const mockLayout = (boxWidth: number) => {
  const widthOf = (el: HTMLElement) =>
    parseFloat(el.style.fontSize || "16") * 10;
  jest
    .spyOn(HTMLElement.prototype, "scrollWidth", "get")
    .mockImplementation(function (this: HTMLElement) {
      return widthOf(this);
    });
  jest
    .spyOn(HTMLElement.prototype, "clientWidth", "get")
    .mockImplementation(() => boxWidth);
};

describe("useShrinkToFit", () => {
  afterEach(() => jest.restoreAllMocks());

  it("leaves a label that already fits untouched", () => {
    mockLayout(200);
    render(<Label text="May 2026" />);
    const span = screen.getByTestId("label");
    expect(span.style.fontSize).toBe("");
    expect(span.style.whiteSpace).toBe("");
  });

  it("steps the font size down until the label fits on one line", () => {
    mockLayout(140);
    render(<Label text="September 2026" />);
    const span = screen.getByTestId("label");
    expect(span.style.fontSize).toBe("14px");
    expect(span.style.whiteSpace).toBe("nowrap");
  });

  it("stops at 0.8rem and lets the label wrap when it still does not fit", () => {
    mockLayout(50);
    render(<Label text="September 2026" />);
    const span = screen.getByTestId("label");
    expect(span.style.fontSize).toBe("12.8px");
    expect(span.style.whiteSpace).toBe("");
  });

  it("fits again when the label changes", () => {
    mockLayout(140);
    const { rerender } = render(<Label text="September 2026" />);
    const span = screen.getByTestId("label");
    expect(span.style.fontSize).toBe("14px");
    mockLayout(200);
    rerender(<Label text="May 2026" />);
    expect(span.style.fontSize).toBe("");
  });
});
