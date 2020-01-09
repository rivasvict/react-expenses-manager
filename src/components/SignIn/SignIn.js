import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

function SignIn() {
  const history = useHistory();
  const [state, setState] = useState({
    username: '',
    password: ''
  });

  function handleChange(event) {
    const { name, value } = event.currentTarget;
    setState({
      ...state,
      [name]: value
    });
  };

  function handleSubmit(event) {
    event.preventDefault();
  };

  function handleCancel() {
    history.push('/');
  }

  return (
    <form>
      <label>Username: </label><input type='text' name='username' placeholder='First Name goes here' onChange={handleChange}></input><br />
      {/*this.props.validationErrors.find(validationError => validationError.path === 'userName') ? <label>Username is required</label> : null*/}
      <label>Password: </label><input type='password' name='password' placeholder='Type password' onChange={handleChange}></input><br />
      {/*this.props.isLoading ? 'loading...' : <button type='submit' onClick={this.handleSubmit}>Submit</button>*/}
      <button type='submit' onClick={handleSubmit}>Submit</button>
      <button onClick={handleCancel}>Cancel</button>
    </form>
  );
}

export default SignIn;