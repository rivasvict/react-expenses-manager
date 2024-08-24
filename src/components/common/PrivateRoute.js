import React from "react";
import { Redirect, Route, useLocation } from "react-router-dom";
import { connect } from "react-redux";
import { setUser } from "../../redux/userManager/actoionCreators";

function PrivateRoute({ user, onSetUser, isLoading, children, ...res }) {
  const location = useLocation();
  const RedirectToDefault = () => {
    return <Redirect to={{ pathname: "/", state: { from: location } }} />;
  };

  const render = () => {
    if (user.isLoading && !user.email) {
      onSetUser();
    } else {
      return children;
    }

    return RedirectToDefault();
  };

  return <Route {...res} render={render} />;
}

const mapSateToProps = (state) => ({
  user: state.userManager.user,
  isLoading: state.userManager.isLoading,
});

const mapActionToProps = (dispacth) => ({
  onSetUser: () => dispacth(setUser()),
});

export default connect(mapSateToProps, mapActionToProps)(PrivateRoute);
