import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { Provider } from 'react-redux';
import Lobby from './components/Lobby';
import SignUp from './components/SignUp/SignUp'
import SignIn from './components/SignIn/SignIn'

function App({ reduxStore }) {
  return (
    <Provider store={reduxStore}>
      <Router>
        <Switch>
          <Route path='/' component={Lobby} exact />
          <Route path='/expenses-manager' component={Dashboard} />
          <Route path='/sign-up' component={SignUp} exact />
          <Route path='/sign-in' component={SignIn} exact />
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
