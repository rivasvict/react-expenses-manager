import React, { useEffect } from 'react';
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/'
import { connect } from 'react-redux';
import { createUser } from '../../redux/userManager/actoionCreators';
import { useHistory } from 'react-router-dom';
import _ from 'lodash';

const userModel = FormModel({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  'password-retype': ''
})
  .addBuiltInValidationToField({ fieldName: 'firstName', validation: { name: 'required', message: 'First name is required' }})
  .addBuiltInValidationToField({ fieldName: 'lastName', validation: { name: 'required', message: 'Last name is required' }})
  .addBuiltInValidationToField({ fieldName: 'email', validation: { name: 'required', message: 'Email is required' }})
  .addBuiltInValidationToField({ fieldName: 'password', validation: { name: 'required', message: 'Password is required' }})
  .addBuiltInValidationsToField({ fieldName: 'password-retype', validations: [{ name: 'required', message: 'Password is required' }, { name: 'match', comparatorFieldName: 'password', message: 'Password fields should match' }]})
  .setModelInitialValidityState(false);

function handleChange({ event, dispatchFormStateChange }) {
  const { name, value } = event.currentTarget;
  dispatchFormStateChange({ name, value });
};

function SignUp({ isLoading, userCreated, onCreateUser }) {

  const history = useHistory();

  useEffect(() => {
    if (userCreated) {
      history.push('/');
    }
  });

  function handleSubmit({ event, values }) {
    event.preventDefault();
    onCreateUser(_.omit(values, 'password-retype'));
  };

  function handleCancel(event) {
    event.preventDefault();
    history.push('/');
  }

  return (
    <FormValidation formModel={userModel} render={({ dispatchFormStateChange, formState }) => {
      return (
        <React.Fragment>
          <label>First Name: </label>
          <ValidateField>
            <input type='text' name='firstName' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br /><label>Last Name: </label>
          <ValidateField>
            <input type='text' name='lastName' placeholder='Last Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br /><label>Email: </label>
          <ValidateField>
            <input type='text' name='email' placeholder='Your email goes here'  onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br /><label>Password: </label>
          <ValidateField>
            <input type='password' name='password' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br /><label>Retype password: </label>
          <ValidateField>
            <input type='password' name='password-retype' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br />{isLoading ? 'loading...' : <button type='submit' onClick={(event) => handleSubmit({ event, values: formState.values })} disabled={!formState.isModelValid}>Submit</button>}
          <button onClick={handleCancel}>Cancel</button>
        </React.Fragment>
      )
    }}/>
  )
};

const mapStateToPros = state => ({
  isLoading: state.userManager.isLoading,
  validationErrors: state.userManager.validationErrors.validation,
  userCreated: state.userManager.userCreated
});

const mapActionsToProps = dispatch => ({
  onCreateUser: userPayload => dispatch(createUser(userPayload))
});

export default connect(mapStateToPros, mapActionsToProps)(SignUp);