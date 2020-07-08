import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

function Lobby({ user }) {
  const isThereAnyUser = () => user && user.email;

  return (
    <div>
      { isThereAnyUser() ? <Link to='/expenses-manager'>Dashboard</Link> : null }
      { !isThereAnyUser() ? <Link to='/sign-up'>Sign up</Link> : null }
      { !isThereAnyUser() ? <Link to='/sign-in'>Sign in</Link> : null }
    </div>
  )
}

const mapStateToProps = state => ({
  user: state.userManager.user
});

export default connect(mapStateToProps)(Lobby);