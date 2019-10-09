import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <Switch>
        <Route path='/' component={Dashboard} />
      </Switch>
    </Router>
  );
}

export default App;
