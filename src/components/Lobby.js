import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import SignIn from './SignIn/SignIn';

function Lobby({ user }) {
  const isThereAnyUser = () => user && user.email;

  return (
    <div>
      {
        !isThereAnyUser() ?
          <section>
            <SignIn />
            <Link to='/sign-up'>Sign up</Link>
          </section>
          : null
      }
    </div>
  )
}

const mapStateToProps = state => ({
  user: state.userManager.user
});

export default connect(mapStateToProps)(Lobby);