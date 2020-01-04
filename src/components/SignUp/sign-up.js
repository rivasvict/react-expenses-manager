import React from 'react';
import { connect } from 'react-redux';
import { createUser } from '../../redux/userManager/actoionCreators';

class SignUp extends React.Component {

  constructor() {
    super();
    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    };
  }

  handleSubmit = async event => {
    event.preventDefault();
    try {
      await this.props.onCreateUser(this.state);
      console.log('hola');
    } catch (error) {
      console.error(error);
    }
  };

  handleChange = event => {
    const { name, value } = event.currentTarget;
    this.setState(() => ({
      [name]: value
    }));
  };

  render = () => {
    return (
      <form>
        <label>First Name: </label><input type='text' name='firstName' placeholder='First Name goes here' value={this.state.firstName} onChange={this.handleChange}></input><br />
        {this.props.validationErrors.find(validationError => validationError.path === 'firstName') ? <label>First name is required</label> : null}
        <label>Last Name: </label><input type='text' name='lastName' placeholder='Last Name goes here' value={this.state.lastName} onChange={this.handleChange}></input><br />
        <label>Email: </label><input type='text' name='email' placeholder='Your email goes here' value={this.state.email} onChange={this.handleChange}></input><br />
        <label>Password: </label><input type='password' name='password' placeholder='Type password' value={this.state.password} onChange={this.handleChange}></input><br />
        {this.props.isLoading ? 'loading...' : <button type='submit' onClick={this.handleSubmit}>Submit</button>}
      </form>
    )
  }
}

const mapStateToPros = state => ({
  isLoading: state.userManager.isLoading,
  validationErrors: state.userManager.validationErrors.validation
});

const mapActionsToProps = dispatch => ({
  onCreateUser: userPayload => dispatch(createUser(userPayload))
});

export default connect(mapStateToPros, mapActionsToProps)(SignUp);