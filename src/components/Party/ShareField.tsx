import React from "react";
import { Button } from "react-bootstrap";
import { Icon } from "@iconify/react";
import copyIcon from "@iconify-icons/codicon/copy";
import eyeIcon from "@iconify-icons/codicon/eye";
import eyeClosedIcon from "@iconify-icons/codicon/eye-closed";

interface ShareFieldProps {
  label: string;
  value: string;
  masked?: boolean;
  copied: boolean;
  onCopy: () => void;
  revealed?: boolean;
  onToggleReveal?: () => void;
}

/**
 * A read-only monospace field, a Copy icon button, and a transient "Copied"
 * live region (docs/multi-user-sync/DESIGN.md §3.4). The app has no toast
 * primitive, and the inline aria-live confirmation avoids introducing one.
 *
 * `masked` adds a show/hide toggle, for the invitation password: it should
 * not sit on screen in plaintext while the organizer is reading the code out
 * to someone, but they still need to be able to check what they typed.
 */
const ShareField = ({
  label,
  value,
  masked = false,
  copied,
  onCopy,
  revealed,
  onToggleReveal,
}: ShareFieldProps) => (
  <div className="share-field">
    <span className="share-field__label">{label}</span>
    <input
      className="share-field__value"
      type={masked && !revealed ? "password" : "text"}
      value={value}
      readOnly
      aria-label={label}
    />
    {masked && onToggleReveal && (
      <Button
        variant="secondary"
        className="share-field__icon-button"
        aria-label={
          revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`
        }
        onClick={onToggleReveal}
      >
        <Icon icon={revealed ? eyeClosedIcon : eyeIcon} aria-hidden="true" />
      </Button>
    )}
    <Button
      variant="secondary"
      className="share-field__icon-button"
      aria-label={`Copy ${label.toLowerCase()}`}
      onClick={onCopy}
    >
      <Icon icon={copyIcon} aria-hidden="true" />
    </Button>
    <span className="share-field__copied" aria-live="polite">
      {copied ? "Copied" : ""}
    </span>
  </div>
);

export default ShareField;
