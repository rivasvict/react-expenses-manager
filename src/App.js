import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { Provider } from 'react-redux';
import Lobby from './components/Lobby';
import SignUp from './components/SignUp/SignUp'
import SignIn from './components/SignIn/SignIn'
import PrivateRoute from './components/common/PrivateRoute';

function App({ reduxStore }) {
  return (
    <Provider store={reduxStore}>
      <Router>
        <Switch>
          <Route path='/' component={Lobby} exact />
          <PrivateRoute path='/expenses-manager'>
            <Dashboard />
          </PrivateRoute>
          <Route path='/sign-up' component={SignUp} exact />
          <Route path='/sign-in' component={SignIn} exact />
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
