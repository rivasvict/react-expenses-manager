import React from 'react';
import FormValidation from '../../helpers/form-validation/FormValidation'
import ValidateField from '../../helpers/form-validation/ValidateField'
import { connect } from 'react-redux';
import { createUser } from '../../redux/userManager/actoionCreators';
import { useHistory } from 'react-router-dom';
import { setFormValue } from '../../helpers/form-validation/actions';
import _ from 'lodash';

function SignUp(props) {

  const userModel = {
    values: {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    },
    validation: {
      firstName: [],
      lastName: [],
      email: [],
      password: []
    },
    isModelValid: false
  }

  const history = useHistory();

  function handleSubmit(event) {
    event.preventDefault();
    // props.onCreateUser(_.omit(formState, 'retype-password'));
  };

  function handleChange({ event, dispatch }) {
    const { name, value } = event.currentTarget;
    dispatch(setFormValue({name, value}))
  };

  function handleCancel(event) {
    event.preventDefault();
    history.push('/');
  }

  return (
    <FormValidation formModel={userModel} render={({ dispatch, formState }) => {
      return (
        <React.Fragment>
          {formState.isModelValid ? 'VALID' : 'INVALID'}
          <label>First Name: </label>
          <ValidateField 
            validationTypes={[{ name: 'required', message: 'TEST MESSAGE' }]}
            value={formState.values.firstName}>

            <input type='text' name='firstName' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatch })}></input>
          </ValidateField>
          {props.validationErrors.find(validationError => validationError.path === 'firstName') ? <React.Fragment><br /><label>First name is required</label></React.Fragment> : null}
          <br /><label>Last Name: </label>
          <ValidateField
            validationTypes={[{ name: 'required', message: 'TEST MESSAGE' }]}
            value={formState.values.lastName}>

            <input type='text' name='lastName' placeholder='Last Name goes here' onChange={(event) => handleChange({ event, dispatch })}></input>
          </ValidateField>
          {props.validationErrors.find(validationError => validationError.path === 'lastName') ? <React.Fragment><br /><label>Last name is required</label></React.Fragment> : null}
          <br /><label>Email: </label><input type='text' name='email' placeholder='Your email goes here'  onChange={(event) => handleChange({ event, dispatch })}></input>
          {props.validationErrors.find(validationError => validationError.path === 'email') ? <React.Fragment><br /><label>Email is required</label></React.Fragment> : null}
          <br /><label>Password: </label><input type='password' name='password' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatch })}></input>
          {props.validationErrors.find(validationError => validationError.path === 'password') ? <React.Fragment><br /><label>Password is required</label></React.Fragment> : null}
          <br /><label>Retype password: </label><input type='password' name='password-retype' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatch })}></input>
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