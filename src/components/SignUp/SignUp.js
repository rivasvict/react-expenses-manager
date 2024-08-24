import React, { useEffect } from "react";
import {
  FormValidation,
  FormModel,
  ValidateField,
} from "../../helpers/form-validation/";
import { connect } from "react-redux";
import { createUser } from "../../redux/userManager/actoionCreators";
import { useHistory } from "react-router-dom";
import _ from "lodash";
import { Form } from "react-bootstrap";
import { FormButton, InputPassword, InputText } from "../common/Forms";
import NoSessionContainer from "../common/NoSessionContainer";

const userModel = FormModel({
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

function handleChange({ event, dispatchFormStateChange }) {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
}

function SignUp({ isLoading, userCreated, onCreateUser }) {
  const history = useHistory();

  useEffect(() => {
    if (userCreated) {
      history.push("/");
    }
  });

  function handleSubmit({ event, values }) {
    event.preventDefault();
    onCreateUser(_.omit(values, "password-retype"));
  }

  function handleCancel(event) {
    event.preventDefault();
    history.push("/");
  }

  return (
    <NoSessionContainer>
      <FormValidation
        formModel={userModel}
        className="app-form"
        CustomFormComponent={Form}
        render={({ dispatchFormStateChange, formState }) => {
          return (
            <React.Fragment>
              <Form.Group>
                <ValidateField>
                  <InputText
                    name="firstName"
                    placeholder="First Name"
                    onChange={(event) =>
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
                    onChange={(event) =>
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
                    onChange={(event) =>
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
                    onChange={(event) =>
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
                    onChange={(event) =>
                      handleChange({ event, dispatchFormStateChange })
                    }
                  />
                </ValidateField>
              </Form.Group>
              {/** TODO: Make sure the event for sending to the backend is handled in
               * onSubmit of the form as it is standard for forms
               */}
              {isLoading ? (
                "loading..."
              ) : (
                <FormButton
                  variant="primary"
                  type="submit"
                  onClick={(event) =>
                    handleSubmit({ event, values: formState.values })
                  }
                  disabled={!formState.isModelValid}
                >
                  Submit
                </FormButton>
              )}
              <FormButton
                variant="secondary"
                block
                className="vertical-standard-space"
                onClick={handleCancel}
              >
                Cancel
              </FormButton>
            </React.Fragment>
          );
        }}
      />
    </NoSessionContainer>
  );
}

const mapStateToPros = (state) => ({
  isLoading: state.userManager.isLoading,
  validationErrors: state.userManager.validationErrors.validation,
  userCreated: state.userManager.userCreated,
});

const mapActionsToProps = (dispatch) => ({
  onCreateUser: (userPayload) => dispatch(createUser(userPayload)),
});

export default connect(mapStateToPros, mapActionsToProps)(SignUp);
