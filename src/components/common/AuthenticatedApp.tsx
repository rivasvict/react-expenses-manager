import React from "react";
import { Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Dashboard from "../Dashboard/Dashboard";
import SignUp from "../SignUp/SignUp";
import Lobby from "../Lobby";

const AuthenticatedApp = ({ location }) => {
  const PublicRoutes = () => (
    <>
      <Route path="/sign-up" component={SignUp} exact />
      <Route path="/" component={Lobby} exact />
    </>
  );

  return (
    <>
      <PrivateRoute path="/dashboard" from={location}>
        <Dashboard />
      </PrivateRoute>
      <PublicRoutes />
    </>
  );
};

export default AuthenticatedApp;
