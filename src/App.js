import React from "react";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
/**
 * TODO:
 * Reinstate <AuthenticatedApp />
 * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
 */
// import AuthenticatedApp from './components/AuthenticatedApp';
import { Provider, connect } from "react-redux";
import { setUser } from "./redux/userManager/actoionCreators";
import WithBalance from "./components/WithBalance";

const mapStateToProps = (state) => ({ user: state.userManager.user });

const mapActionToProps = (dispatch) => ({
  onSetUser: () => dispatch(setUser()),
});

const Routes = connect(
  mapStateToProps,
  mapActionToProps
)(() => {
  return (
    <>
      {/**
       * TODO:
       * Reinstate <AuthenticatedApp />
       * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
       *
       * Additionally, when this code is reinstated, make sure to:
       * 1. Remove the use of `WithBalance` and its children
       * 2. In src/redux/expensesManager/actionCreators.js, remember to use the STORAGE_TYPES.REMOTE instead of
       * STORAGE_TYPES.LOCAL, this will make authentication work again when https://github.com/rivasvict/expenses-manager-api
       * is configured again
       */}
      {/* <AuthenticatedApp /> */}
      <WithBalance>
        <Dashboard />
      </WithBalance>
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
