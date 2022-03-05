import React from 'react';
import { useHistory } from 'react-router-dom';
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/';
import { connect } from 'react-redux';
import { logIn } from '../../redux/userManager/actoionCreators';
import { Col, Form, Row } from 'react-bootstrap';
import { FormButton, InputPassword, InputText } from '../common/Forms';
import NoSessionContainer from '../common/NoSessionContainer';
import ButtonLikeLink from '../common/ButtonLikeLink';

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
      <FormValidation formModel={userModel} className='app-form' CustomFormComponent={Form} render={({ dispatchFormStateChange, formState }) => {
        return (
          <React.Fragment>
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
            {/** TODO: Make sure the event for sending to the backend is handled in
             * onSubmit of the form as it is standard for forms
             */}
            <FormButton type='submit' variant='secondary' onClick={(event) => handleSubmit({ event, onLogIn, values: formState.values, history })} disabled={!formState.isModelValid}>Sign In</FormButton>
            <Row>
              <Col xs={12}>
                <ButtonLikeLink className='btn-primary' to='/sign-up' buttonTitle='Sign up' />
              </Col>
            </Row>
          </React.Fragment>
        );
      }} />
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