import React from "react";
import { render, act, RenderResult } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../redux/store";
import WithBalance from "../../components/WithBalance";
import WithDataDisclaimer from "../../components/Dashboard/WithDataDisclaimer";
import Dashboard from "../../components/Dashboard";
import { setSession, SyncSession } from "../../services/session";

interface RenderAppResult extends RenderResult {
  store: ReturnType<typeof setupStore>;
  user: UserEvent;
}

interface RenderAppOptions {
  /** Start the app already logged in (pre-writes sync.session). */
  session?: SyncSession;
}

export async function renderApp(
  initialRoute = "/",
  { session }: RenderAppOptions = {}
): Promise<RenderAppResult> {
  // Suppress the first-run data disclaimer modal
  localStorage.setItem("everShowDataDisclaimer", "0");

  // Must be written before the store is created — the syncManager slice
  // hydrates from localStorage (that is what makes logins survive reloads).
  if (session) setSession(session);

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
