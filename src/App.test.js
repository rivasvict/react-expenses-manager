import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { setupStore } from "./redux/store";

it("renders without crashing", () => {
  const div = document.createElement("div");
  ReactDOM.render(<App reduxStore={setupStore()} />, div);
  ReactDOM.unmountComponentAtNode(div);
});
