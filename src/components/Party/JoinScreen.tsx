import React, { useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Form } from "react-bootstrap";
import { MainContentContainer } from "../common/MainContentContainer";
import { FormButton, InputPassword, InputText } from "../common/Forms";
import { joinParty } from "../../redux/syncManager/actionCreators";
import {
  SYNC_ERROR_CODES,
  SyncApiError,
} from "../../services/syncApi/contract";
import {
  getSyncErrorMessage,
  TranslationKey,
  useTranslation,
} from "../../i18n";
import "./styles.scss";

// Invitation-specific error copy, never technical
// (docs/multi-user-sync/DESIGN.md §3.5): each of these is something the
// invitee can act on, which a raw error code is not.
const JOIN_ERROR_COPY: { [code: string]: TranslationKey } = {
  [SYNC_ERROR_CODES.INVITATION_WRONG_PASSWORD]: "join.wrongPassword",
  [SYNC_ERROR_CODES.INVITATION_USED]: "join.invitationUsed",
  [SYNC_ERROR_CODES.ALREADY_IN_PARTY]: "join.alreadyInParty",
  [SYNC_ERROR_CODES.INVITATION_NOT_FOUND]: "join.invitationNotFound",
};

interface JoinScreenProps {
  onJoinParty: (payload: { code: string; password: string }) => Promise<unknown>;
}

/**
 * Invitee redeems an invitation (DESIGN §3.5; AC-2.5–2.7,
 * docs/multi-user-sync/PRD.md). The fields stay filled on a wrong password so
 * the user can retry immediately, which is safe precisely because a wrong
 * password does not consume the invitation server-side (EC-7).
 */
const JoinScreen = ({ onJoinParty }: JoinScreenProps) => {
  const translator = useTranslation();
  const { t } = translator;
  const history = useHistory();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SyncApiError | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onJoinParty({ code, password });
      history.push("/party");
    } catch (joinError) {
      setError(joinError as SyncApiError);
      setIsLoading(false);
    }
  };

  return (
    <MainContentContainer className="party-screen" pageTitle={t("party.join")}>
      <Form className="party-card" onSubmit={handleSubmit}>
        <p className="party-card__description">{t("join.description")}</p>
        <Form.Group>
          <InputText
            name="code"
            placeholder={t("join.codePlaceholder")}
            value={code}
            onChange={(event: any) => setCode(event.currentTarget.value)}
          />
        </Form.Group>
        <Form.Group>
          <InputPassword
            name="password"
            placeholder={t("auth.password")}
            value={password}
            onChange={(event: any) => setPassword(event.currentTarget.value)}
          />
        </Form.Group>
        {error && (
          <p
            className="restore-backup-error text-danger vertical-standard-space"
            role="alert"
          >
            {JOIN_ERROR_COPY[error.code]
              ? t(JOIN_ERROR_COPY[error.code])
              : getSyncErrorMessage(error, translator, "join.failed")}
          </p>
        )}
        <FormButton
          variant="primary"
          type="submit"
          disabled={code.trim() === "" || password.trim() === "" || isLoading}
        >
          {isLoading ? t("join.joining") : t("join.submit")}
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
    </MainContentContainer>
  );
};

const mapActionsToProps = (dispatch: any) => ({
  onJoinParty: (payload: { code: string; password: string }) =>
    dispatch(joinParty(payload)),
});

export default connect(null, mapActionsToProps)(JoinScreen);
