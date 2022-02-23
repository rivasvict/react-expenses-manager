import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/';
import { connect } from 'react-redux';
import { logIn } from '../../redux/userManager/actoionCreators';
import { Col, Form, Row } from 'react-bootstrap';
import { FormButton, FormContent, InputPassword, InputText } from '../common/Forms';
import NoSessionContainer from '../common/NoSessionContainer';

function handleChange({ event, dispatchFormStateChange }) {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
};

function handleSubmit({ event, onLogIn, values, history }) {
  event.preventDefault();
  onLogIn({ userPayload: values, history });
};

const userModel = FormModel({
  username: '',
  password: ''
})
  .addBuiltInValidationToField({ fieldName: 'username', validation: { name: 'required', message: 'Username is required' } })
  .addBuiltInValidationToField({ fieldName: 'password', validation: { name: 'required', message: 'Password is required' } });

function SignIn({ onLogIn }) {
  const history = useHistory();
  return (
    <NoSessionContainer>
      <FormValidation formModel={userModel} className='user-form' CustomFormComponent={Form} render={({ dispatchFormStateChange, formState }) => {
        return (
          <FormContent>
            <Form.Group>
              <ValidateField>
                <InputText name='username' placeholder='Email' onChange={(event) => handleChange({ event, dispatchFormStateChange })} />
              </ValidateField>
            </Form.Group>
            <Form.Group>
              <ValidateField>
                <InputPassword name='password' placeholder='Password' onChange={(event) => handleChange({ event, dispatchFormStateChange })} />
              </ValidateField>
            </Form.Group>
            <FormButton type='submit' variant='secondary' onClick={(event) => handleSubmit({ event, onLogIn, values: formState.values, history })} disabled={!formState.isModelValid}>Sign In</FormButton>
          </FormContent>
        );
      }} />
      <Row>
        <Col xs={12}>
          <Link className='btn btn-primary btn-block vertical-standard-space' to='/sign-up'>Sign up</Link>
        </Col>
      </Row>
    </NoSessionContainer>
  );
}

const mapStateToProps = state => ({
  user: state.userManager.user
});

const mapActionsToProps = dispatch => ({
  onLogIn: userPayload => dispatch(logIn(userPayload))
});

export default connect(mapStateToProps, mapActionsToProps)(SignIn)