import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/';
import { connect } from 'react-redux';
import { logIn } from '../../redux/userManager/actoionCreators';
import { Button, Form } from 'react-bootstrap';

function handleChange({ event, dispatchFormStateChange }) {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
};

function handleSubmit({ event, onLogIn, values }) {
  event.preventDefault();
  onLogIn(values);
};

const userModel = FormModel({
  username: '',
  password: ''
})
  .addBuiltInValidationToField({ fieldName: 'username', validation: { name: 'required', message: 'Username is required' } })
  .addBuiltInValidationToField({ fieldName: 'password', validation: { name: 'required', message: 'Password is required' } });

function SignIn({ onLogIn, user }) {
  const history = useHistory();

  useEffect(() => {
    if (user && user._id) {
      history.push('/dashboard');
    }
  });

  return (
    <FormValidation formModel={userModel} CustomFormComponent={Form} render={({ dispatchFormStateChange, formState }) => {
      return (
        <React.Fragment>
          <Form.Group>
            <Form.Label>Username: </Form.Label>
            <ValidateField>
              <Form.Control type='text' name='username' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })} />
            </ValidateField>
          </Form.Group>
          <Form.Group>
            <Form.Label>Password: </Form.Label>
            <ValidateField>
              <Form.Control type='password' name='password' placeholder='Type password' onChange={(event) => handleChange({ event, dispatchFormStateChange })} />
            </ValidateField>
          </Form.Group>
          <Button type='submit' variant='primary' onClick={(event) => handleSubmit({ event, onLogIn, values: formState.values })} disabled={!formState.isModelValid}>Sign In</Button>
        </React.Fragment>
      );
    }} />

  );
}

const mapStateToProps = state => ({
  user: state.userManager.user
});

const mapActionsToProps = dispatch => ({
  onLogIn: userPayload => dispatch(logIn(userPayload))
});

export default connect(mapStateToProps, mapActionsToProps)(SignIn)