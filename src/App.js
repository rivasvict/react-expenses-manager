import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import { Provider } from 'react-redux';

function App({ reduxStore }) {
  return (
    <Provider store={reduxStore}>
      <Router>
        <Switch>
          <Route path='/' component={Dashboard} />
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
