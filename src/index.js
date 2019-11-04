import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import setupStore from './redux/store';
import App from './App';
import * as serviceWorker from './serviceWorker';

const reduxStore = setupStore();

ReactDOM.render(<App reduxStore={{ reduxStore }}/>, document.getElementById('root'));

serviceWorker.unregister();
