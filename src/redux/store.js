/**
 * TODO:
 * This module has no test file. The central 401 hook wired in setupStore()
 * (dispatching SYNC_SESSION_CLEARED into the live store on an unauthorized
 * response) is currently only exercised end-to-end via renderApp.tsx and the
 * component tests that call setupStore(). Direct coverage is tracked in:
 * https://github.com/rivasvict/react-expenses-manager/issues/160
 */
import { createStore, applyMiddleware } from "redux";
import reducer from "./reducers";
import { composeWithDevTools as composeWithReduxDevTools } from "redux-devtools-extension";
import thunk from "redux-thunk";
import { setOnUnauthorized } from "../services/syncApi";
import { SYNC_SESSION_CLEARED } from "./syncManager/actions";

export const setupStore = () => {
  const store = createStore(
    reducer,
    composeWithReduxDevTools(applyMiddleware(thunk))
  );
  // Central 401 handling (sync API): when a token stops being accepted the
  // client clears the stored session; this hook lets the live store degrade
  // the UI to logged-out too, instead of looping on failed requests.
  setOnUnauthorized(() => store.dispatch({ type: SYNC_SESSION_CLEARED }));
  return store;
};
