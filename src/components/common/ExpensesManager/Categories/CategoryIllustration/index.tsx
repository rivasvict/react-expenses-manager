import React from "react";
import "./styles.scss";

/**
 * The empty-category illustration: a dashed card with two tags (green and
 * gold) and a gold plus, painted only with tokens. Decorative.
 */
const CategoryIllustration = () => (
  <svg
    className="category-illustration"
    viewBox="0 0 132 112"
    aria-hidden="true"
  >
    <ellipse cx="66" cy="100" rx="50" ry="7" className="category-illustration__shadow" />
    <rect x="22" y="18" width="88" height="70" rx="12" className="category-illustration__card" />
    <g transform="rotate(-14 38 34)">
      <path d="M18 26h30l10 10-10 10H18z" className="category-illustration__tag category-illustration__tag--income" />
      <circle cx="48" cy="36" r="3" className="category-illustration__hole category-illustration__hole--income" />
    </g>
    <g transform="rotate(10 92 70)">
      <path d="M72 62h30l10 10-10 10H72z" className="category-illustration__tag category-illustration__tag--accent" />
      <circle cx="102" cy="72" r="3" className="category-illustration__hole category-illustration__hole--accent" />
    </g>
    <circle cx="66" cy="53" r="13" className="category-illustration__plus-disc" />
    <path d="M66 46v14M59 53h14" className="category-illustration__plus" />
  </svg>
);

export default CategoryIllustration;
