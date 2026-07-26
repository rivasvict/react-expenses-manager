import React from "react";
import { BrowserRouter as Router, Switch } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import { Provider, connect } from "react-redux";
import { setUser } from "./redux/userManager/actionCreators";
import WithBalance from "./components/WithBalance";
import WithDataDisclaimer from "./components/Dashboard/WithDataDisclaimer";

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
      <WithBalance>
        <WithDataDisclaimer>
          <Dashboard />
        </WithDataDisclaimer>
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
