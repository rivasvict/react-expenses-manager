import { RefObject, useEffect, useLayoutEffect, useRef } from "react";

const STEP_PX = 0.5;
const FLOOR_REM = 0.8;
const FALLBACK_PX = 16;

// scrollWidth and clientWidth are whole pixels, so a label a fraction of a
// pixel too wide would pass them and then wrap. The text's own box is exact
// (not available in jsdom, where the whole-pixel check above is all there is).
const isWiderThanBox = (el: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const text = range.getBoundingClientRect?.();
  return Boolean(text) && text.width > el.getBoundingClientRect().width + 0.01;
};

// Fits a text label on one line by stepping its font size down, never below
// 0.8rem. A display font, a long month name in another language or browser text
// zoom can make a label wider than its box; wrapping is only the last resort,
// once the floor is reached.
const shrinkToFit = (el: HTMLElement) => {
  el.style.fontSize = "";
  el.style.whiteSpace = "nowrap";
  const doesOverflow = () =>
    el.scrollWidth > el.clientWidth || isWiderThanBox(el);
  if (!doesOverflow()) {
    el.style.whiteSpace = "";
    return;
  }
  const px = (value: string) => parseFloat(value) || FALLBACK_PX;
  const base = px(window.getComputedStyle(el).fontSize);
  const floor =
    FLOOR_REM * px(window.getComputedStyle(document.documentElement).fontSize);
  let size = base;
  while (doesOverflow() && size > floor) {
    size = Math.max(floor, size - STEP_PX);
    el.style.fontSize = `${size}px`;
  }
  if (doesOverflow()) el.style.whiteSpace = "";
};

/**
 * Returns a ref for the element holding a label that must fit its box. It is
 * re-fitted on every change of `deps` (the label, language, theme), once the
 * fonts are loaded, and whenever the box's parent changes width. The element
 * needs `min-width: 0` so it can be narrower than its text.
 */
export const useShrinkToFit = <T extends HTMLElement>(
  deps: readonly unknown[],
): RefObject<T> => {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    if (ref.current) shrinkToFit(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const refit = () => shrinkToFit(el);

    document.fonts?.ready.then(refit);
    document.fonts?.addEventListener?.("loadingdone", refit);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && el.parentElement) {
      let lastWidth = el.parentElement.clientWidth;
      observer = new ResizeObserver(() => {
        const width = el.parentElement?.clientWidth ?? lastWidth;
        if (width === lastWidth) return;
        lastWidth = width;
        refit();
      });
      observer.observe(el.parentElement);
    }

    return () => {
      document.fonts?.removeEventListener?.("loadingdone", refit);
      observer?.disconnect();
    };
  }, []);

  return ref;
};

export default useShrinkToFit;
