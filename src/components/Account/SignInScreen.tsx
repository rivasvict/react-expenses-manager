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

// Same fields/validation as the dormant SignIn.js (DESIGN §2.2), wrapped in
// the in-app MainContentContainer instead of NoSessionContainer.
const buildUserModel = () =>
  FormModel({
    email: "",
    password: "",
  })
    .addBuiltInValidationToField({
      fieldName: "email",
      validation: { name: "required", message: "Email is required" },
    })
    .addBuiltInValidationToField({
      fieldName: "password",
      validation: { name: "required", message: "Password is required" },
    })
    .setModelInitialValidityState(false);

const handleChange = ({ event, dispatchFormStateChange }: any) => {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
};

const SignInScreen = ({ onSignIn }: { onSignIn: (payload: any) => Promise<void> }) => {
  const history = useHistory();
  const [userModel] = useState(buildUserModel);
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
    <MainContentContainer pageTitle="Sign in">
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
                  placeholder="Email"
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
                  placeholder="Password"
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
                  ? "Email or password is incorrect."
                  : error.message || "Could not sign in. Please try again."}
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
              {isLoading ? "Signing in…" : "Sign in"}
            </FormButton>
            <FormButton
              variant="secondary"
              className="vertical-standard-space"
              onClick={handleCancel}
            >
              Cancel
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
