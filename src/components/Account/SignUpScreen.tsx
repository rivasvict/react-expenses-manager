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

// Same fields and validation rules as the dormant SignUp.js (DESIGN §2.2);
// only the JSX wrapper differs (in-app MainContentContainer, not the
// NoSessionContainer full-page takeover).
const buildUserModel = () =>
  FormModel({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    "password-retype": "",
  })
    .addBuiltInValidationToField({
      fieldName: "firstName",
      validation: { name: "required", message: "First name is required" },
    })
    .addBuiltInValidationToField({
      fieldName: "lastName",
      validation: { name: "required", message: "Last name is required" },
    })
    .addBuiltInValidationToField({
      fieldName: "email",
      validation: { name: "required", message: "Email is required" },
    })
    .addBuiltInValidationToField({
      fieldName: "password",
      validation: { name: "required", message: "Password is required" },
    })
    .addBuiltInValidationsToField({
      fieldName: "password-retype",
      validations: [
        { name: "required", message: "Password is required" },
        {
          name: "match",
          comparatorFieldName: "password",
          message: "Password fields should match",
        },
      ],
    })
    .setModelInitialValidityState(false);

const handleChange = ({ event, dispatchFormStateChange }: any) => {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
};

const SignUpScreen = ({ onSignUp }: { onSignUp: (payload: any) => Promise<void> }) => {
  const history = useHistory();
  const [userModel] = useState(buildUserModel);
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
    <MainContentContainer pageTitle="Sign up">
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
                  placeholder="First Name"
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
                  placeholder="Last Name"
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
            <Form.Group>
              <ValidateField>
                <InputPassword
                  name="password-retype"
                  placeholder="Retype Password"
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
                    An account with this email already exists. Try signing in
                    instead. <Link to="/sign-in">Sign in</Link>
                  </React.Fragment>
                ) : (
                  error.message || "Could not sign up. Please try again."
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
              {isLoading ? "Signing up…" : "Sign up"}
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
  onSignUp: (payload: any) => dispatch(signUp(payload)),
});

export default connect(null, mapActionsToProps)(SignUpScreen);
