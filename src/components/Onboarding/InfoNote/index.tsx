import React from "react";
import "./styles.scss";

/** A quiet, neutral note with an info icon (reassurance, not a warning). */
const InfoNote = ({ children }: { children: React.ReactNode }) => (
  <p className="info-note">
    <svg viewBox="0 0 24 24" aria-hidden="true" className="info-note__icon">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
    <span>{children}</span>
  </p>
);

export default InfoNote;
