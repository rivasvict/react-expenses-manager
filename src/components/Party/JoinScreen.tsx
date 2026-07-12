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
import "./styles.scss";

// DESIGN §3.5: invitation-specific error copy, never technical.
const JOIN_ERROR_COPY: { [code: string]: string } = {
  [SYNC_ERROR_CODES.INVITATION_WRONG_PASSWORD]:
    "That password doesn't match this invitation. Double-check it with whoever invited you and try again.",
  [SYNC_ERROR_CODES.INVITATION_USED]:
    "This invitation has already been used. Ask the organizer to send you a new one.",
  [SYNC_ERROR_CODES.ALREADY_IN_PARTY]:
    "You already belong to a party. Refresh to see it.",
  [SYNC_ERROR_CODES.INVITATION_NOT_FOUND]:
    "That invitation code doesn't exist. Double-check it with whoever invited you.",
};

interface JoinScreenProps {
  onJoinParty: (payload: { code: string; password: string }) => Promise<unknown>;
}

/**
 * Invitee redeems an invitation (DESIGN §3.5, AC-2.5–2.7). The fields stay
 * filled on a wrong password so the user can retry immediately — the
 * invitation is not consumed (EC-7).
 */
const JoinScreen = ({ onJoinParty }: JoinScreenProps) => {
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
    <MainContentContainer className="party-screen" pageTitle="Join a party">
      <Form className="party-card" onSubmit={handleSubmit}>
        <p className="party-card__description">
          Enter the invitation code and password the organizer shared with
          you.
        </p>
        <Form.Group>
          <InputText
            name="code"
            placeholder="Invitation code"
            value={code}
            onChange={(event: any) => setCode(event.currentTarget.value)}
          />
        </Form.Group>
        <Form.Group>
          <InputPassword
            name="password"
            placeholder="Password"
            value={password}
            onChange={(event: any) => setPassword(event.currentTarget.value)}
          />
        </Form.Group>
        {error && (
          <p
            className="restore-backup-error text-danger vertical-standard-space"
            role="alert"
          >
            {JOIN_ERROR_COPY[error.code] ||
              error.message ||
              "Could not join the party. Please try again."}
          </p>
        )}
        <FormButton
          variant="primary"
          type="submit"
          disabled={code.trim() === "" || password.trim() === "" || isLoading}
        >
          {isLoading ? "Joining…" : "Join"}
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
    </MainContentContainer>
  );
};

const mapActionsToProps = (dispatch: any) => ({
  onJoinParty: (payload: { code: string; password: string }) =>
    dispatch(joinParty(payload)),
});

export default connect(null, mapActionsToProps)(JoinScreen);
