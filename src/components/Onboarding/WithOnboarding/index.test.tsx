import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../../redux/store";
import { LanguageProvider } from "../../../i18n";
import { PrivacyProvider } from "../../../privacy";
import WithOnboarding from ".";

beforeEach(() => localStorage.clear());

const renderGate = (route: string) =>
  render(
    <Provider store={setupStore()}>
      <LanguageProvider>
        <PrivacyProvider>
          <MemoryRouter initialEntries={[route]}>
            <WithOnboarding>
              <p>The dashboard</p>
            </WithOnboarding>
          </MemoryRouter>
        </PrivacyProvider>
      </LanguageProvider>
    </Provider>
  );

describe("WithOnboarding", () => {
  it("sends a new user to the wizard", () => {
    renderGate("/");
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
    expect(screen.queryByText("The dashboard")).not.toBeInTheDocument();
  });

  it("lets a returning user through and keeps them off /welcome", () => {
    localStorage.setItem("onboarding.completed", "1");
    renderGate("/welcome");
    expect(screen.getByText("The dashboard")).toBeInTheDocument();
  });

  it("hands over to the app once the wizard is skipped", async () => {
    renderGate("/");
    await userEvent.click(screen.getByRole("button", { name: "Skip setup" }));
    expect(await screen.findByText("The dashboard")).toBeInTheDocument();
    expect(localStorage.getItem("onboarding.completed")).toBe("1");
  });
});
