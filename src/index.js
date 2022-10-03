import React from 'react';
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.scss';
import { setupStore } from './redux/store';
import App from './App';
import * as serviceWorker from './serviceWorker';

const reduxStore = setupStore();

const root = createRoot(document.getElementById('root'));
root.render(<App reduxStore={reduxStore}/>);

serviceWorker.unregister();
