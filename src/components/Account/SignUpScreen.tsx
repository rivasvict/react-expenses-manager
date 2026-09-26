import React, { useState } from "react";
import { connect } from "react-redux";
import { Link, useHistory } from "react-router-dom";
import { Form } from "react-bootstrap";
import _ from "lodash";
import {
  FormValidation,
  FormModel,
  ValidateField,
} from "../../helpers/form-validation/";
import { FormButton, InputPassword, InputText } from "../common/Forms";
import { MainContentContainer } from "../common/MainContentContainer";
import { signUp } from "../../redux/syncManager/actionCreators";
import {
  SYNC_ERROR_CODES,
  SyncApiError,
} from "../../services/syncApi/contract";
import { getSyncErrorMessage, Translator, useTranslation } from "../../i18n";

// Same fields and validation rules as the dormant SignUp.js
// (docs/multi-user-sync/DESIGN.md §2.2); only the JSX wrapper differs (in-app
// MainContentContainer, not the NoSessionContainer full-page takeover).
const buildUserModel = ({ t }: Translator) =>
  FormModel({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    "password-retype": "",
  })
    .addBuiltInValidationToField({
      fieldName: "firstName",
      validation: { name: "required", message: t("auth.firstNameRequired") },
    })
    .addBuiltInValidationToField({
      fieldName: "lastName",
      validation: { name: "required", message: t("auth.lastNameRequired") },
    })
    .addBuiltInValidationToField({
      fieldName: "email",
      validation: { name: "required", message: t("auth.emailRequired") },
    })
    .addBuiltInValidationToField({
      fieldName: "password",
      validation: { name: "required", message: t("auth.passwordRequired") },
    })
    .addBuiltInValidationsToField({
      fieldName: "password-retype",
      validations: [
        { name: "required", message: t("auth.passwordRequired") },
        {
          name: "match",
          comparatorFieldName: "password",
          message: t("auth.passwordsMustMatch"),
        },
      ],
    })
    .setModelInitialValidityState(false);

const handleChange = ({ event, dispatchFormStateChange }: any) => {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
};

const SignUpScreen = ({ onSignUp }: { onSignUp: (payload: any) => Promise<void> }) => {
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
      await onSignUp(_.omit(values, "password-retype"));
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
    <MainContentContainer pageTitle={t("account.signUp")}>
      <FormValidation
        formModel={userModel}
        className="app-form"
        CustomFormComponent={Form}
        render={({ dispatchFormStateChange, formState }: any) => (
          <React.Fragment>
            <Form.Group>
              <ValidateField>
                <InputText
                  name="firstName"
                  placeholder={t("auth.firstName")}
                  onChange={(event: any) =>
                    handleChange({ event, dispatchFormStateChange })
                  }
                />
              </ValidateField>
            </Form.Group>
            <Form.Group>
              <ValidateField>
                <InputText
                  name="lastName"
                  placeholder={t("auth.lastName")}
                  onChange={(event: any) =>
                    handleChange({ event, dispatchFormStateChange })
                  }
                />
              </ValidateField>
            </Form.Group>
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
            <Form.Group>
              <ValidateField>
                <InputPassword
                  name="password-retype"
                  placeholder={t("auth.retypePassword")}
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
                {error.code === SYNC_ERROR_CODES.EMAIL_TAKEN ? (
                  <React.Fragment>
                    {t("signUp.emailTaken")}{" "}
                    <Link to="/sign-in">{t("account.signIn")}</Link>
                  </React.Fragment>
                ) : (
                  getSyncErrorMessage(error, translator, "signUp.failed")
                )}
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
              {isLoading ? t("signUp.submitting") : t("account.signUp")}
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
  onSignUp: (payload: any) => dispatch(signUp(payload)),
});

export default connect(null, mapActionsToProps)(SignUpScreen);
