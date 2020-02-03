import React from 'react';
import { isUserLoggedIn } from '../../helpers/general';
import { Redirect, Route } from 'react-router-dom';

function PrivateRoute ({ children, ...res }) {
  return (
    <Route
      {...res}
      render={() => isUserLoggedIn() ? children : <Redirect to={{ pathname: 'sign-in' }} />}
    />
  );
}

export default PrivateRoute;