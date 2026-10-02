import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import SlideReveal from ".";

describe("SlideReveal", () => {
  it("renders nothing while closed and its children once open", () => {
    const { rerender } = render(<SlideReveal open={false}>panel</SlideReveal>);
    expect(screen.queryByText("panel")).not.toBeInTheDocument();

    rerender(<SlideReveal open>panel</SlideReveal>);
    expect(screen.getByTestId("slide-reveal")).toHaveClass(
      "slide-reveal--open",
    );
  });

  it("unmounts immediately on close when no animation is running", () => {
    const { rerender } = render(<SlideReveal open>panel</SlideReveal>);
    rerender(<SlideReveal open={false}>panel</SlideReveal>);
    expect(screen.queryByText("panel")).not.toBeInTheDocument();
  });

  it("stays mounted while the closing animation runs, then unmounts", () => {
    const original = window.getComputedStyle;
    window.getComputedStyle = ((element: Element) => ({
      ...original(element),
      animationName: "slide-reveal-up",
    })) as typeof window.getComputedStyle;

    try {
      const { rerender } = render(<SlideReveal open>panel</SlideReveal>);
      rerender(<SlideReveal open={false}>panel</SlideReveal>);

      const wrapper = screen.getByTestId("slide-reveal");
      expect(wrapper).toHaveClass("slide-reveal--closing");

      fireEvent.animationEnd(wrapper);
      expect(screen.queryByText("panel")).not.toBeInTheDocument();
    } finally {
      window.getComputedStyle = original;
    }
  });

  it("slides back down when reopened mid-close", () => {
    const original = window.getComputedStyle;
    window.getComputedStyle = ((element: Element) => ({
      ...original(element),
      animationName: "slide-reveal-up",
    })) as typeof window.getComputedStyle;

    try {
      const { rerender } = render(<SlideReveal open>panel</SlideReveal>);
      rerender(<SlideReveal open={false}>panel</SlideReveal>);
      rerender(<SlideReveal open>panel</SlideReveal>);
      expect(screen.getByTestId("slide-reveal")).toHaveClass(
        "slide-reveal--open",
      );
    } finally {
      window.getComputedStyle = original;
    }
  });
});
