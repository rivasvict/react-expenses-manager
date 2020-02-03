import React from 'react';
import { Link } from 'react-router-dom';
import { isUserLoggedIn } from '../helpers/general';

function Lobby() {
  return (
    <div>
      { isUserLoggedIn() ? <Link to='/expenses-manager'>Dashboard</Link> : null }
      { !isUserLoggedIn() ? <Link to='/sign-up'>Sign up</Link> : null }
      { !isUserLoggedIn() ? <Link to='/sign-in'>Sign in</Link> : null }
    </div>
  )
}

export default Lobby;