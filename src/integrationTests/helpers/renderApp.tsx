import React from "react";
import { render, act, RenderResult } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../redux/store";
import WithBalance from "../../components/WithBalance";
import WithDataDisclaimer from "../../components/Dashboard/WithDataDisclaimer";
import Dashboard from "../../components/Dashboard";

interface RenderAppResult extends RenderResult {
  store: ReturnType<typeof setupStore>;
  user: UserEvent;
}

export async function renderApp(initialRoute = "/"): Promise<RenderAppResult> {
  // Suppress the first-run data disclaimer modal
  localStorage.setItem("everShowDataDisclaimer", "0");

  const store = setupStore();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  let result!: RenderResult;
  await act(async () => {
    result = render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <WithBalance>
            <WithDataDisclaimer>
              {/** @ts-ignore */}
              <Dashboard />
            </WithDataDisclaimer>
          </WithBalance>
        </MemoryRouter>
      </Provider>
    );
  });

  return { ...result, store, user };
}
