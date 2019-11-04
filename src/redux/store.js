import { createStore } from 'redux';
import reducer from './reducers/';
import { composeWithDevTools as composeWithReduxDevTools } from "redux-devtools-extension";

export const setupStore = () => createStore(reducer, composeWithReduxDevTools());
