import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { setUser } from '../../redux/userManager/actoionCreators';

function PrivateRoute({ user, onSetUser, isLoading, children, ...res }) {

  const RedirectToDefault = () => {
    return <Redirect to={{ pathname: '/' }} />;
  };

  const render = () => {
    if (user.isLoading && !user.email) {
      onSetUser();
      return <div>Loading...</div>
    } else if (user.email) {
      return children;
    }

    return RedirectToDefault();
  };

  return (
    <Route
      {...res}
      render={render}
    />
  );
}

const mapSateToProps = state => ({
  user: state.userManager.user,
  isLoading: state.userManager.isLoading
});

const mapActionToProps = dispacth => ({
  onSetUser: () => dispacth(setUser())
})

export default connect(mapSateToProps, mapActionToProps)(PrivateRoute);