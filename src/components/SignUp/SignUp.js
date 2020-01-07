import React, { useState } from 'react';
import { connect } from 'react-redux';
import { createUser } from '../../redux/userManager/actoionCreators';
import { history } from '../../helpers/history';

function SignUp(props) {

  const [state, setState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })

  function handleSubmit(event) {
    event.preventDefault();
    props.onCreateUser(state);
  };

  function handleChange(event) {
    const { name, value } = event.currentTarget;
    setState({
      ...state,
      [name]: value
    });
  };

  function handleCancel() {
    history.push('/');
  }

  return (
    <form>
      <label>First Name: </label><input type='text' name='firstName' placeholder='First Name goes here'  onChange={handleChange}></input><br />
      {props.validationErrors.find(validationError => validationError.path === 'firstName') ? <label>First name is required</label> : null}
      <label>Last Name: </label><input type='text' name='lastName' placeholder='Last Name goes here'  onChange={handleChange}></input><br />
      <label>Email: </label><input type='text' name='email' placeholder='Your email goes here'  onChange={handleChange}></input><br />
      <label>Password: </label><input type='password' name='password' placeholder='Type password'  onChange={handleChange}></input><br />
      {props.isLoading ? 'loading...' : <button type='submit' onClick={handleSubmit}>Submit</button>}
      <button onClick={handleCancel}>Cancel</button>
    </form>
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