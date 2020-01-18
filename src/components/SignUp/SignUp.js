import React from 'react';
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/'
import { connect } from 'react-redux';
import { createUser } from '../../redux/userManager/actoionCreators';
import { useHistory } from 'react-router-dom';

function SignUp(props) {

  const userModel = FormModel({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
    .addCustomValidationToField({ fieldName: 'firstName', validation: (value) => value === '' ? 'First validation' : ''  })
    .addCustomValidationsToField({ fieldName: 'firstName', validations: [(value) => value === '' ? 'Second validation' : '', (value) => value === '' ? 'Third validation' : ''] })
    .addBuiltInValidationToField({ fieldName: 'firstName', validation: { name: 'required', message: 'A simple custom message' }})
    .addBuiltInValidationsToField({ fieldName: 'firstName', validations: [{ name: 'required', message: 'A simple custom message' }, { name: 'required', message: 'A simple custom message' }]})
    .setModelInitialValidityState(false);

  const history = useHistory();

  function handleSubmit(event) {
    event.preventDefault();
    // props.onCreateUser(_.omit(formState, 'retype-password'));
  };

  function handleChange({ event, dispatchFormStateChange }) {
    const { name, value } = event.currentTarget;
    dispatchFormStateChange({ name, value });
  };

  function handleCancel(event) {
    event.preventDefault();
    history.push('/');
  }

  return (
    <FormValidation formModel={userModel} render={({ dispatchFormStateChange, formState }) => {
      return (
        <React.Fragment>
          {formState.isModelValid ? 'VALID' : 'INVALID'}
          <label>First Name: </label>
          <ValidateField>
            <input type='text' name='firstName' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br /><label>Last Name: </label>
          <input type='text' name='lastName' placeholder='Last Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          {props.validationErrors.find(validationError => validationError.path === 'lastName') ? <React.Fragment><br /><label>Last name is required</label></React.Fragment> : null}
          <br /><label>Email: </label><input type='text' name='email' placeholder='Your email goes here'  onChange={(event) => handleChange({ event, dispatchFormStateChange, formState })}></input>
          {props.validationErrors.find(validationError => validationError.path === 'email') ? <React.Fragment><br /><label>Email is required</label></React.Fragment> : null}
          <br /><label>Password: </label><input type='password' name='password' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatchFormStateChange, formState })}></input>
          {props.validationErrors.find(validationError => validationError.path === 'password') ? <React.Fragment><br /><label>Password is required</label></React.Fragment> : null}
          <br /><label>Retype password: </label><input type='password' name='password-retype' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatchFormStateChange, formState })}></input>
          <br />{props.isLoading ? 'loading...' : <button type='submit' onClick={handleSubmit}>Submit</button>}
          <button onClick={handleCancel}>Cancel</button>
        </React.Fragment>
      )
    }}/>
  )
};

const mapStateToPros = state => ({
  isLoading: state.userManager.isLoading,
  validationErrors: state.userManager.validationErrors.validation
});

const mapActionsToProps = dispatch => ({
  onCreateUser: userPayload => dispatch(createUser(userPayload))
});

export default connect(mapStateToPros, mapActionsToProps)(SignUp);