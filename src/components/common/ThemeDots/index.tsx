import React from "react";
import type { Theme } from "../../../themes";
import "./styles.scss";

interface ThemeDotsProps {
  theme: Theme;
}

/**
 * Four overlapping dots that stand for a theme: its page, accent, income and
 * expense colors. Decorative: the theme's name is always next to it.
 */
const ThemeDots = ({ theme }: ThemeDotsProps) => (
  <span
    className="theme-dots"
    data-testid="theme-dots"
    data-theme={theme.id}
    aria-hidden="true"
  >
    <i className="theme-dots__page" />
    <i className="theme-dots__accent" />
    <i className="theme-dots__income" />
    <i className="theme-dots__expense" />
  </span>
);

export default ThemeDots;
