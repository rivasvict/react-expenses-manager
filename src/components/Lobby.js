import React from 'react';
import { Link } from 'react-router-dom';

function Lobby() {
  return (
    <div>
      <Link to='/expenses-manager'>Dashboard</Link>
      <Link to='/sign-up'>Sign up</Link>
      <Link to='/sign-in'>Sign in</Link>
    </div>
  )
}

export default Lobby;