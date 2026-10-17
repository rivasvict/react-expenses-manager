import React, { useEffect, useId, useRef } from "react";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/codicon/close";
import "./styles.scss";

interface BottomSheetProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
  /** A small line above the title, inside the heading ("Expense category"). */
  eyebrow?: string;
  /**
   * "tall" lets the sheet grow to 92% of the viewport, with a scrolling body
   * and the footer fixed at its foot.
   */
  variant?: "default" | "tall";
  /** Actions pinned under the scrolling body, above a divider. */
  footer?: React.ReactNode;
  /** "alertdialog" for a sheet that confirms a destructive action. */
  role?: "dialog" | "alertdialog";
  /** Focused on open instead of the heading (e.g. the sheet's only field). */
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
}

/**
 * A bottom sheet over a scrim: grabber, heading, close chip and a scrolling
 * body, optionally with a fixed footer. Mount it to open it: it focuses its
 * heading (or `initialFocusRef`), closes on Escape or a tap on the scrim, and
 * the caller returns focus to whatever opened it.
 */
const BottomSheet = ({
  title,
  closeLabel,
  onClose,
  children,
  eyebrow,
  variant = "default",
  footer,
  role = "dialog",
  initialFocusRef,
  className = "",
}: BottomSheetProps) => {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(
    () => (initialFocusRef?.current || headingRef.current)?.focus(),
    // Focus moves once, when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const hasSections = variant === "tall" || Boolean(footer);
  const panelClassName = [
    "bottom-sheet__panel",
    variant === "tall" ? "bottom-sheet__panel--tall" : "",
    hasSections ? "bottom-sheet__panel--sections" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`bottom-sheet ${className}`.trim()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <div
        className="bottom-sheet__scrim"
        data-testid="bottom-sheet-scrim"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className={panelClassName} role={role} aria-labelledby={headingId}>
        <div className="bottom-sheet__grabber" aria-hidden="true" />
        <div className="bottom-sheet__header">
          <h2
            id={headingId}
            className="bottom-sheet__heading"
            tabIndex={-1}
            ref={headingRef}
          >
            {eyebrow && (
              <span className="bottom-sheet__eyebrow">{eyebrow}</span>
            )}
            {title}
          </h2>
          <button
            type="button"
            className="bottom-sheet__close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <Icon icon={closeIcon} aria-hidden="true" />
          </button>
        </div>
        {hasSections ? (
          <>
            <div className="bottom-sheet__body">{children}</div>
            {footer && <div className="bottom-sheet__footer">{footer}</div>}
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default BottomSheet;
