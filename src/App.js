import React from 'react';
import { BrowserRouter as Router, Switch, Route, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { Provider, connect } from 'react-redux';
import Lobby from './components/Lobby';
import SignUp from './components/SignUp/SignUp'
import PrivateRoute from './components/common/PrivateRoute';
import { setUser } from './redux/userManager/actoionCreators';

const mapStateToProps = state => ({ user: state.userManager.user });

const mapActionToProps = dispatch => ({
  onSetUser: () => dispatch(setUser())
});

const Routes = connect(mapStateToProps, mapActionToProps)(({ user, onSetUser }) => {
  const PublicRoutes = () => (
    <>
      <Route path='/sign-up' component={SignUp} exact />
      <Route path='/' component={Lobby} exact />
    </>
  );

  const location = useLocation();
  const PrivateRoutes = () => (
    <>
      <PrivateRoute path='/dashboard' from={location}>
        <Dashboard />
      </PrivateRoute>
      <PublicRoutes />
    </>
  );

  return (
    <PrivateRoutes />
  );
});

function App({ reduxStore }) {
  return (
    <Provider store={reduxStore}>
      <Router>
        <Switch>
          <Routes />
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
