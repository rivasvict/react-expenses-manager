import React from 'react';
import { Link } from 'react-router-dom';

function Lobby() {
  return (
    <div>
      <Link to='/expenses-manager'>Dashboard</Link>
      <Link to='/sign-up'>Sign up</Link>
    </div>
  )
}

export default Lobby;