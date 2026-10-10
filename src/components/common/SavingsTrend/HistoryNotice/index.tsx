import React from "react";
import "./styles.scss";

interface HistoryNoticeProps {
  title: string;
  body: string;
  /** The one thing to do about it, when there is something to do. */
  action?: { label: string; onClick: () => void };
}

/**
 * The card that stands in for the headline and chart when the picked range
 * cannot be drawn honestly: no earlier month yet, or a range that reaches
 * before the first recorded month.
 */
const HistoryNotice = ({ title, body, action }: HistoryNoticeProps) => (
  <div className="history-notice">
    <span className="history-notice__title">{title}</span>
    <span className="history-notice__body">{body}</span>
    {action && (
      <button
        type="button"
        className="btn btn-primary history-notice__action"
        onClick={action.onClick}
      >
        {action.label}
      </button>
    )}
  </div>
);

export default HistoryNotice;
