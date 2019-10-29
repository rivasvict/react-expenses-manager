import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
// Import tthe redux provider
import { Provider } from 'react-redux';
// Import createStore from redux
import { createStore } from 'redux';
// Import root reducer
import rootReducer from './redux/reducers/index'

// Import action
import { castHolaAction } from './redux/actions/index'

const store = createStore(rootReducer);

store.dispatch(castHolaAction('Whatever I want'));
console.log(store.getState());
function App() {
  return (
    <Provider store={store}>
      <Router>
        <Switch>
          <Route path='/' component={Dashboard} />
        </Switch>
      </Router>
    </Provider>
  );
}

export default App;
