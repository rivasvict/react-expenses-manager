import React, { useEffect, useId, useRef } from "react";
import { Icon } from "@iconify/react";
import closeIcon from "@iconify-icons/codicon/close";
import "./styles.scss";

interface BottomSheetProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * A bottom sheet over a scrim: grabber, heading, close chip and a scrolling
 * body. Mount it to open it: it focuses its heading, closes on Escape or a tap
 * on the scrim, and the caller returns focus to whatever opened it.
 */
const BottomSheet = ({
  title,
  closeLabel,
  onClose,
  children,
}: BottomSheetProps) => {
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div
      className="bottom-sheet"
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
      <div
        className="bottom-sheet__panel"
        role="dialog"
        aria-labelledby={headingId}
      >
        <div className="bottom-sheet__grabber" aria-hidden="true" />
        <div className="bottom-sheet__header">
          <h2
            id={headingId}
            className="bottom-sheet__heading"
            tabIndex={-1}
            ref={headingRef}
          >
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
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
