import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/';
import { connect } from 'react-redux';
import { logIn } from '../../redux/userManager/actoionCreators';
import { Button, Form, Row, Col } from 'react-bootstrap';

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
    <FormValidation formModel={userModel} className='user-form' CustomFormComponent={Form} render={({ dispatchFormStateChange, formState }) => {
      return (
        <Row>
          <Col xs={12}>
            <Form.Group>
              <ValidateField>
                <Form.Control type='text' className='text' name='username' placeholder='Email' onChange={(event) => handleChange({ event, dispatchFormStateChange })} />
              </ValidateField>
            </Form.Group>
            <Form.Group>
              <ValidateField>
                <Form.Control type='password' className='text' name='password' placeholder='Password' onChange={(event) => handleChange({ event, dispatchFormStateChange })} />
              </ValidateField>
            </Form.Group>
            <Button block type='submit' variant='secondary' onClick={(event) => handleSubmit({ event, onLogIn, values: formState.values })} disabled={!formState.isModelValid}>Sign In</Button>
          </Col>
        </Row>
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