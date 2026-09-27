// TODO: no unit tests cover this file yet — tracked in
// https://github.com/rivasvict/react-expenses-manager/issues/189
import React from "react";
import tokens from "../../../styles/tokens.json";

const { color } = tokens;

/**
 * The app's brand mark, redrawn from the original raster logo as a single
 * vector source (candidate 3 of the visual refresh). It keeps the gold-over-
 * slate double-bar motif — ledger lines / an upward glance — but moves the
 * container from a circle to the app's rounded-square shape language, and
 * stays crisp at every density. This one component is the source the header
 * lockup renders from; `public/logo.svg` mirrors it for the favicon / PWA
 * icons.
 */
type BrandMarkProps = {
  size?: number;
  className?: string;
  title?: string;
};

const BrandMark = ({ size = 40, className, title }: BrandMarkProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 48 48"
    role="img"
    aria-label={title ?? "Expenses Tracker"}
  >
    <rect
      x="1.5"
      y="1.5"
      width="45"
      height="45"
      rx="11"
      fill={color["bg-surface"]}
      stroke={color.accent}
      strokeWidth="1.6"
    />
    <path d="M8.5 19.6 17.6 15l21.9 7.9-9.1 4.6z" fill={color.accent} />
    <path
      d="M8.5 28.6 17.6 24l21.9 7.9-9.1 4.6z"
      fill={color["brand-mark-shade"]}
    />
  </svg>
);

export default BrandMark;
