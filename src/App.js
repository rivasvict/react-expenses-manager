import React from 'react';
import { BrowserRouter as Router, Switch } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
/**
 * TODO:
 * Reinstate <AuthenticatedApp />
 * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
*/
// import AuthenticatedApp from './components/AuthenticatedApp';
import { Provider, connect } from 'react-redux';
import { setUser } from './redux/userManager/actoionCreators';

const mapStateToProps = state => ({ user: state.userManager.user });

const mapActionToProps = dispatch => ({
  onSetUser: () => dispatch(setUser())
});

const Routes = connect(mapStateToProps, mapActionToProps)(() => {
  return (
    <>
      {/**
       * TODO:
       * Reinstate <AuthenticatedApp />
       * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
      */}
      {/* <AuthenticatedApp /> */}
      <Dashboard />
    </>
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
