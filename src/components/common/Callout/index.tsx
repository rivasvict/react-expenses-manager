import React from "react";
import "./styles.scss";

export type CalloutTone = "warn" | "danger";

interface CalloutProps {
  tone: CalloutTone;
  children: React.ReactNode;
}

/**
 * A tinted note with an icon: amber "warn" (a triangle) for a consequence
 * the user should know before saving, red "danger" (a circle) for an action
 * that cannot be undone.
 */
const Callout = ({ tone, children }: CalloutProps) => (
  <div className={`callout callout--${tone}`}>
    <svg viewBox="0 0 24 24" aria-hidden="true" className="callout__icon">
      {tone === "danger" ? (
        <circle cx="12" cy="12" r="10" className="callout__icon-fill" />
      ) : (
        <path d="M12 3 2 21h20z" className="callout__icon-fill" />
      )}
      <path
        d={tone === "danger" ? "M12 7v6M12 16.5v.5" : "M12 10v5M12 17.5v.5"}
        className="callout__icon-mark"
      />
    </svg>
    <span className="callout__text">{children}</span>
  </div>
);

export default Callout;
