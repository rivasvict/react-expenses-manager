import { useEffect, useState } from "react";

// Mirrors `$nav-breakpoint` (768px) in src/variables.scss: below it the Filters
// panel is a bottom sheet over the fixed tab bar, at or above it an inline panel.
const SHEET_LAYOUT_QUERY = "(max-width: 767.98px)";

const readMatch = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia(SHEET_LAYOUT_QUERY).matches;

/**
 * Whether the Filters panel is currently laid out as a bottom sheet. Without
 * `matchMedia` (jsdom) it answers false, i.e. the inline panel.
 */
const useIsSheetLayout = (): boolean => {
  const [isSheetLayout, setIsSheetLayout] = useState(readMatch);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia(SHEET_LAYOUT_QUERY);
    const handleChange = () => setIsSheetLayout(query.matches);
    handleChange();
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return isSheetLayout;
};

export default useIsSheetLayout;
