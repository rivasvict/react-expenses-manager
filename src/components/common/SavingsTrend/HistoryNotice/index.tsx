import React from "react";
import "./styles.scss";

interface HistoryNoticeProps {
  title: string;
  body: string;
  /** The one thing to do about it, when there is something to do. */
  action?: {
    label: string;
    onClick: () => void;
    /** "secondary" when the way out is a side step, not the next step. */
    variant?: "primary" | "secondary";
  };
  /** A small decorative mark above the title (e.g. a category type chip). */
  icon?: React.ReactNode;
}

/**
 * The card that stands in for the headline and chart when the picked range
 * cannot be drawn honestly: no earlier month yet, a range that reaches
 * before the first recorded month, or nothing recorded in a category.
 */
const HistoryNotice = ({ title, body, action, icon }: HistoryNoticeProps) => (
  <div className="history-notice">
    {icon && <span className="history-notice__icon">{icon}</span>}
    <span className="history-notice__title">{title}</span>
    <span className="history-notice__body">{body}</span>
    {action && (
      <button
        type="button"
        className={`btn btn-${action.variant ?? "primary"} history-notice__action`}
        onClick={action.onClick}
      >
        {action.label}
      </button>
    )}
  </div>
);

export default HistoryNotice;
