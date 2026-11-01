import React from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/themes.generated.css";
import "./index.scss";
import { setupStore } from "./redux/store";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { applyStoredTheme } from "./themes";

// Before the first render, so there is no flash of the default theme.
applyStoredTheme();

const reduxStore = setupStore();

const container: Element | DocumentFragment = document.getElementById(
  "root",
) as Element;

const root = createRoot(container);
root.render(<App reduxStore={reduxStore} />);

serviceWorker.register();
