import React, { useState } from "react";
import { connect } from "react-redux";
import { useHistory } from "react-router-dom";
import { Form } from "react-bootstrap";
import {
  FormValidation,
  FormModel,
  ValidateField,
} from "../../helpers/form-validation/";
import { FormButton, InputPassword, InputText } from "../common/Forms";
import { MainContentContainer } from "../common/MainContentContainer";
import { signIn } from "../../redux/syncManager/actionCreators";
import {
  SYNC_ERROR_CODES,
  SyncApiError,
} from "../../services/syncApi/contract";
import { getSyncErrorMessage, Translator, useTranslation } from "../../i18n";

// Same fields/validation as the dormant SignIn.js
// (docs/multi-user-sync/DESIGN.md §2.2), wrapped in the in-app
// MainContentContainer instead of NoSessionContainer. AC tags below are
// defined in docs/multi-user-sync/PRD.md.
const buildUserModel = ({ t }: Translator) =>
  FormModel({
    email: "",
    password: "",
  })
    .addBuiltInValidationToField({
      fieldName: "email",
      validation: { name: "required", message: t("auth.emailRequired") },
    })
    .addBuiltInValidationToField({
      fieldName: "password",
      validation: { name: "required", message: t("auth.passwordRequired") },
    })
    .setModelInitialValidityState(false);

const handleChange = ({ event, dispatchFormStateChange }: any) => {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
};

const SignInScreen = ({ onSignIn }: { onSignIn: (payload: any) => Promise<void> }) => {
  const translator = useTranslation();
  const { t } = translator;
  const history = useHistory();
  const [userModel] = useState(() => buildUserModel(translator));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SyncApiError | null>(null);

  const handleSubmit = async ({ event, values }: any) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await onSignIn(values);
      history.push("/account");
    } catch (submitError) {
      setError(submitError as SyncApiError);
      setIsLoading(false);
    }
  };

  const handleCancel = (event: React.MouseEvent) => {
    event.preventDefault();
    history.push("/account");
  };

  return (
    <MainContentContainer pageTitle={t("account.signIn")}>
      <FormValidation
        formModel={userModel}
        className="app-form"
        CustomFormComponent={Form}
        render={({ dispatchFormStateChange, formState }: any) => (
          <React.Fragment>
            <Form.Group>
              <ValidateField>
                <InputText
                  name="email"
                  placeholder={t("auth.email")}
                  onChange={(event: any) =>
                    handleChange({ event, dispatchFormStateChange })
                  }
                />
              </ValidateField>
            </Form.Group>
            <Form.Group>
              <ValidateField>
                <InputPassword
                  name="password"
                  placeholder={t("auth.password")}
                  onChange={(event: any) =>
                    handleChange({ event, dispatchFormStateChange })
                  }
                />
              </ValidateField>
            </Form.Group>
            {error && (
              <p
                className="restore-backup-error text-danger vertical-standard-space"
                role="alert"
              >
                {/* AC-1.5: deliberately generic — never says which field
                    was wrong. */}
                {error.code === SYNC_ERROR_CODES.INVALID_CREDENTIALS
                  ? t("signIn.invalidCredentials")
                  : getSyncErrorMessage(error, translator, "signIn.failed")}
              </p>
            )}
            <FormButton
              variant="primary"
              type="submit"
              onClick={(event: any) =>
                handleSubmit({ event, values: formState.values })
              }
              disabled={!formState.isModelValid || isLoading}
            >
              {isLoading ? t("signIn.submitting") : t("account.signIn")}
            </FormButton>
            <FormButton
              variant="secondary"
              className="vertical-standard-space"
              onClick={handleCancel}
            >
              {t("common.cancel")}
            </FormButton>
          </React.Fragment>
        )}
      />
    </MainContentContainer>
  );
};

const mapActionsToProps = (dispatch: any) => ({
  onSignIn: (payload: any) => dispatch(signIn(payload)),
});

export default connect(null, mapActionsToProps)(SignInScreen);
