import React, { useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { Provider, connect } from 'react-redux';
import Lobby from './components/Lobby';
import SignUp from './components/SignUp/SignUp'
import SignIn from './components/SignIn/SignIn'
import PrivateRoute from './components/common/PrivateRoute';
import { setUser } from './redux/userManager/actoionCreators';

const mapStateToProps = state => ({ user: state.userManager.user });

const mapActionToProps = dispatch => ({
  onSetUser: () => dispatch(setUser())
});

const Routes = connect(mapStateToProps, mapActionToProps)(({ user, onSetUser }) => {
  useEffect(() => {
    if (!user.email) {
      onSetUser();
    }
  });

  const PublicRoutes = () => (
    <>
      <Route path='/sign-up' component={SignUp} exact />
      <Route path='/sign-in' component={SignIn} exact />
      <Route path='/' component={Lobby} exact />
    </>
  );

  const PrivateRoutes = () => (
    <>
      <PublicRoutes />
      <PrivateRoute path='/expenses-manager'>
        <Dashboard />
      </PrivateRoute>
    </>
  );

  return (
    <Router>
      <Switch>
        {
          !user.email ? <PublicRoutes /> : <PrivateRoutes />
        }
      </Switch>
    </Router>
  );
});

function App({ reduxStore }) {
  return (
    <Provider store={reduxStore}>
      <Routes />
    </Provider>
  );
}

export default App;
