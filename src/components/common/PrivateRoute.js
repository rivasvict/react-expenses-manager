import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { setUser } from '../../redux/userManager/actoionCreators';

function PrivateRoute ({ user, onSetUser, children, ...res }) {
  const RedirectToDefault = () => {
    onSetUser();
    return <Redirect to={{ pathname: 'sign-in' }} />;
  };

  return (
    <Route
      {...res}
      render={() => user.email ? children : <RedirectToDefault />}
    />
  );
}

const mapSateToProps = state => ({
  user: state.userManager.user
});

const mapActionToProps = dispacth => ({
  onSetUser: () => dispacth(setUser())
})

export default connect(mapSateToProps, mapActionToProps)(PrivateRoute);