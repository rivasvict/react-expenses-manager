import { createStore, applyMiddleware } from 'redux';
import reducer from './reducers/';
import { composeWithDevTools as composeWithReduxDevTools } from "redux-devtools-extension";
import thunk from 'redux-thunk';

export const setupStore = () => createStore(reducer, composeWithReduxDevTools(applyMiddleware(thunk))); 