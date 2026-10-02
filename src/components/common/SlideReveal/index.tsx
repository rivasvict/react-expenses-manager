import React, { useLayoutEffect, useRef, useState } from "react";
import "./styles.scss";

// Safety net in case `animationend` never fires (tab hidden mid-animation).
const EXIT_FALLBACK_MS = 400;

type SlideRevealProps = {
  open: boolean;
  children: React.ReactNode;
};

// jsdom, a missing stylesheet and `prefers-reduced-motion` all leave the
// element without a running animation, so there is nothing to wait for.
const hasExitAnimation = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  const { animationName } = window.getComputedStyle(element);
  return Boolean(animationName) && animationName !== "none";
};

/**
 * Slides its children down when `open` turns true and back up when it turns
 * false, keeping them mounted until the closing animation has finished.
 */
const SlideReveal = ({ open, children }: SlideRevealProps) => {
  const [isMounted, setIsMounted] = useState(open);
  const ref = useRef<HTMLDivElement>(null);

  if (open && !isMounted) setIsMounted(true);

  // Layout effect so a close with nothing to animate unmounts before paint.
  useLayoutEffect(() => {
    if (open || !isMounted) return undefined;
    if (!hasExitAnimation(ref.current)) {
      setIsMounted(false);
      return undefined;
    }
    const timer = window.setTimeout(
      () => setIsMounted(false),
      EXIT_FALLBACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open, isMounted]);

  if (!isMounted) return null;

  return (
    <div
      ref={ref}
      data-testid="slide-reveal"
      className={`slide-reveal slide-reveal--${open ? "open" : "closing"}`}
      onAnimationEnd={(event) => {
        if (!open && event.target === event.currentTarget) setIsMounted(false);
      }}
    >
      <div className="slide-reveal__content">{children}</div>
    </div>
  );
};

export default SlideReveal;
