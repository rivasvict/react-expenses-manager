import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { Provider } from 'react-redux';
import Lobby from './components/Lobby';
import SignUp from './components/SignUp/sign-up'

function App({ reduxStore }) {
  return (
    <Provider store={reduxStore}>
      <Router>
        <Switch>
          <Route path='/expenses-manager' component={Dashboard} />
          <Route path='/' component={Lobby} exact />
          <Route path='/sign-up' component={SignUp} exact />
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
