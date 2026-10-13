import React from "react";
import "./styles.scss";

interface HiddenFigureProps {
  /** A fixed stand-in shown (blurred) instead of the real figure. */
  placeholder: string;
  /** What a screen reader says in place of the figure. */
  label: string;
  className?: string;
}

/**
 * A money figure that Privacy mode is hiding: a blurred, fixed placeholder, so
 * the real digits (and how many there are) never reach the page. It is a
 * labelled image for assistive technology; the placeholder itself is silent.
 */
const HiddenFigure = ({ placeholder, label, className }: HiddenFigureProps) => (
  <span
    className={`hidden-figure ${className ?? ""}`.trim()}
    role="img"
    aria-label={label}
  >
    <span aria-hidden="true">{placeholder}</span>
  </span>
);

export default HiddenFigure;
