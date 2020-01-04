import React from 'react';
import { history } from '../../helpers/history';

class SignIn extends React.Component {
  constructor() {
    super();
    this.state = {
      username: '',
      password: ''
    };
  }

  handleChange = event => {
    const { name, value } = event.currentTarget;
    this.setState(() => ({
      [name]: value
    }));
  };

  handleSubmit = async event => {
    event.preventDefault();
  };

  handleCancel = () => {
    history.push('/');
  }

  render = () => {
    return (
      <form>
        <label>Username: </label><input type='text' name='firstName' placeholder='First Name goes here' value={this.state.firstName} onChange={this.handleChange}></input><br />
        {/*this.props.validationErrors.find(validationError => validationError.path === 'userName') ? <label>Username is required</label> : null*/}
        <label>Password: </label><input type='password' name='password' placeholder='Type password' value={this.state.password} onChange={this.handleChange}></input><br />
        {/*this.props.isLoading ? 'loading...' : <button type='submit' onClick={this.handleSubmit}>Submit</button>*/}
        <button type='submit' onClick={this.handleSubmit}>Submit</button>
        <button onClick={this.handleCancel}>Cancel</button>
      </form>);
  }
}

export default SignIn;