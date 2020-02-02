import React from 'react';
import { useHistory } from 'react-router-dom';
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/';
import { connect } from 'react-redux';
import { logIn } from '../../redux/userManager/actoionCreators';

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
  .addBuiltInValidationToField({ fieldName: 'username', validation: { name: 'required', message: 'Username is required' }})
  .addBuiltInValidationToField({ fieldName: 'password', validation: { name: 'required', message: 'Password is required' }});

function SignIn({ onLogIn, user }) {
  const history = useHistory();

  function handleCancel(event) {
    event.preventDefault();
    history.push('/');
  }

  return (
    <FormValidation formModel={userModel} render={({  dispatchFormStateChange, formState  }) => {
      return (
        <React.Fragment>
          <div>{user._id}</div>
          <label>Username: </label>
          <ValidateField>
            <input type='text' name='username' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <label>Password: </label>
          <ValidateField>
            <input type='password' name='password' placeholder='Type password' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <button type='submit' onClick={(event) => handleSubmit({ event, onLogIn, values: formState.values })} disabled={!formState.isModelValid}>Submit</button>
          <button onClick={(event) => handleCancel(event)}>Cancel</button>
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