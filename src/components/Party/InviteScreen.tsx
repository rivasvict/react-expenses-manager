import React, { useRef, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { Icon } from "@iconify/react";
import copyIcon from "@iconify-icons/codicon/copy";
import eyeIcon from "@iconify-icons/codicon/eye";
import eyeClosedIcon from "@iconify-icons/codicon/eye-closed";
import { MainContentContainer } from "../common/MainContentContainer";
import { FormButton, InputPassword } from "../common/Forms";
import { generateInvitation } from "../../redux/syncManager/actionCreators";
import "./styles.scss";

const COPIED_TIMEOUT_MS = 2000;

interface InviteScreenProps {
  onGenerateInvitation: (payload: { password: string }) => Promise<string>;
}

// A read-only monospace field + Copy icon button + transient "Copied" live
// text (DESIGN §3.4). No toast primitive exists in the app; the inline
// aria-live confirmation avoids introducing one.
const ShareField = ({
  label,
  value,
  masked = false,
  copied,
  onCopy,
  revealed,
  onToggleReveal,
}: {
  label: string;
  value: string;
  masked?: boolean;
  copied: boolean;
  onCopy: () => void;
  revealed?: boolean;
  onToggleReveal?: () => void;
}) => (
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
        aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
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

/**
 * Organizer generates an invitation (DESIGN §3.4, AC-2.3): step 1 sets the
 * invitation password, step 2 shows the one-time code + password with copy
 * buttons. Neither secret is ever logged or persisted client-side — they
 * exist only in component state (AC-2.4/NFR-2).
 */
const InviteScreen = ({ onGenerateInvitation }: InviteScreenProps) => {
  const history = useHistory();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "password" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const copiedTimeout = useRef<number | undefined>(undefined);

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      setCode(await onGenerateInvitation({ password }));
    } catch (generateError) {
      setError(
        (generateError as Error).message || "Could not create the invitation."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (kind: "code" | "password", value: string) => {
    try {
      // jsdom and older browsers may not expose the async clipboard API.
      navigator.clipboard?.writeText(value);
    } catch (copyError) {
      // The field is selectable either way; the confirmation still helps.
    }
    setCopied(kind);
    window.clearTimeout(copiedTimeout.current);
    copiedTimeout.current = window.setTimeout(
      () => setCopied(null),
      COPIED_TIMEOUT_MS
    );
  };

  return (
    <MainContentContainer className="party-screen" pageTitle="Add a member">
      {code === null ? (
        <Form className="party-card" onSubmit={handleGenerate}>
          <h2 className="party-card__title">Set an invitation password</h2>
          <p className="party-card__description">
            The person you invite will need this password together with the
            invitation code.
          </p>
          {error && (
            <p
              className="restore-backup-error text-danger vertical-standard-space"
              role="alert"
            >
              {error}
            </p>
          )}
          <Form.Group>
            <InputPassword
              name="invitationPassword"
              placeholder="Invitation password"
              onChange={(event: any) => setPassword(event.currentTarget.value)}
            />
          </Form.Group>
          <FormButton
            variant="primary"
            type="submit"
            disabled={password.trim() === "" || isLoading}
          >
            {isLoading ? "Generating…" : "Generate invitation"}
          </FormButton>
          <FormButton
            variant="secondary"
            className="vertical-standard-space"
            onClick={(event: any) => {
              event.preventDefault();
              history.push("/party");
            }}
          >
            Cancel
          </FormButton>
        </Form>
      ) : (
        <div className="party-card">
          <h2 className="party-card__title">Invitation ready</h2>
          <ShareField
            label="Code"
            value={code}
            copied={copied === "code"}
            onCopy={() => handleCopy("code", code)}
          />
          <ShareField
            label="Password"
            value={password}
            masked
            revealed={revealed}
            onToggleReveal={() => setRevealed(!revealed)}
            copied={copied === "password"}
            onCopy={() => handleCopy("password", password)}
          />
          <p className="party-card__hint text-secondary">
            Share the code and password over different channels.
          </p>
          <FormButton
            variant="secondary"
            onClick={() => history.push("/party")}
          >
            Done
          </FormButton>
        </div>
      )}
    </MainContentContainer>
  );
};

const mapActionsToProps = (dispatch: any) => ({
  onGenerateInvitation: (payload: { password: string }) =>
    dispatch(generateInvitation(payload)),
});

export default connect(null, mapActionsToProps)(InviteScreen);
