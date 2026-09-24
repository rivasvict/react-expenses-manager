import React, { useRef, useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Form } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import { FormButton, InputPassword } from "../common/Forms";
import ShareField from "./ShareField";
import { generateInvitation } from "../../redux/syncManager/actionCreators";
import { getSyncErrorMessage, useTranslation } from "../../i18n";
import "./styles.scss";

const COPIED_TIMEOUT_MS = 2000;

interface InviteScreenProps {
  onGenerateInvitation: (payload: { password: string }) => Promise<string>;
}

/**
 * Organizer generates an invitation (docs/multi-user-sync/DESIGN.md §3.4;
 * AC-2.3, docs/multi-user-sync/PRD.md): step 1 sets the invitation password,
 * step 2 shows the one-time code and password with copy buttons.
 *
 * Neither secret is ever logged or persisted client-side — they exist only
 * in this component's state (AC-2.4/NFR-2). The code in particular is
 * unrecoverable once this screen is left: the server keeps no plaintext copy,
 * so leaving without copying it means generating a new one.
 */
const InviteScreen = ({ onGenerateInvitation }: InviteScreenProps) => {
  const translator = useTranslation();
  const { t } = translator;
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
        getSyncErrorMessage(
          generateError as Error,
          translator,
          "invite.createFailed"
        )
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
    <MainContentContainer
      className="party-screen"
      pageTitle={t("party.addMember")}
    >
      {code === null ? (
        <Form className="party-card" onSubmit={handleGenerate}>
          <h2 className="party-card__title">{t("invite.setPassword")}</h2>
          <p className="party-card__description">
            {t("invite.setPasswordDescription")}
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
              placeholder={t("invite.passwordPlaceholder")}
              onChange={(event: any) => setPassword(event.currentTarget.value)}
            />
          </Form.Group>
          <FormButton
            variant="primary"
            type="submit"
            disabled={password.trim() === "" || isLoading}
          >
            {isLoading ? t("invite.generating") : t("invite.generate")}
          </FormButton>
          <FormButton
            variant="secondary"
            className="vertical-standard-space"
            onClick={(event: any) => {
              event.preventDefault();
              history.push("/party");
            }}
          >
            {t("common.cancel")}
          </FormButton>
        </Form>
      ) : (
        <div className="party-card">
          <h2 className="party-card__title">{t("invite.ready")}</h2>
          <ShareField
            label={t("invite.code")}
            value={code}
            copied={copied === "code"}
            onCopy={() => handleCopy("code", code)}
          />
          <ShareField
            label={t("auth.password")}
            value={password}
            masked
            revealed={revealed}
            onToggleReveal={() => setRevealed(!revealed)}
            copied={copied === "password"}
            onCopy={() => handleCopy("password", password)}
          />
          <p className="party-card__hint text-secondary">
            {t("invite.shareHint")}
          </p>
          <FormButton
            variant="secondary"
            onClick={() => history.push("/party")}
          >
            {t("invite.done")}
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
