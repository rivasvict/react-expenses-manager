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

function SignIn(props) {
  const history = useHistory();

  function handleCancel() {
    history.push('/');
  }

  return (
    <FormValidation formModel={userModel} render={({  dispatchFormStateChange, formState  }) => {
      return (
        <React.Fragment>
          <label>Username: </label>
          <ValidateField>
            <input type='text' name='username' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <label>Password: </label>
          <ValidateField>
            <input type='password' name='password' placeholder='Type password' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <button type='submit' onClick={(event) => handleSubmit({ event, onLogIn: props.onLogIn, values: formState.values })} disabled={!formState.isModelValid}>Submit</button>
        </React.Fragment>
      );
    }} />

  );
}

const mapStateToProps = () => ({});

const mapActionsToProps = dispatch => ({
  onLogIn: userPayload => dispatch(logIn(userPayload))
});

export default connect(mapStateToProps, mapActionsToProps)(SignIn)