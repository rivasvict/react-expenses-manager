import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { setupStore } from "../../redux/store";
import { LanguageProvider } from "../../i18n";
import { PrivacyProvider } from "../../privacy";
import Onboarding from ".";

beforeEach(() => localStorage.clear());

const openWizard = () => {
  const onDone = jest.fn();
  render(
    <Provider store={setupStore()}>
      <LanguageProvider>
        <PrivacyProvider>
          <MemoryRouter>
            <Onboarding onDone={onDone} />
          </MemoryRouter>
        </PrivacyProvider>
      </LanguageProvider>
    </Provider>
  );
  return onDone;
};

describe("Onboarding", () => {
  it("saves the draft only when Start tracking is tapped", async () => {
    const onDone = openWizard();

    await userEvent.click(screen.getByRole("radio", { name: "Euro" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Food" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Monthly limit for Food" }),
      "200"
    );
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(localStorage.getItem("categoryLists")).toBeNull();
    expect(localStorage.getItem("settings.currency")).toBeNull();
    expect(onDone).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Start tracking" }));

    await screen.findByRole("main");
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem("categoryLists") || "")).toEqual({
      expense: ["Food"],
      income: [],
    });
    expect(JSON.parse(localStorage.getItem("buckets") || "")).toEqual({
      Food: [{ from: "0000-00", limit: 200 }],
    });
    expect(localStorage.getItem("settings.currency")).toBe("EUR");
    expect(localStorage.getItem("onboarding.completed")).toBe("1");
  });

  it("leaves no categories and no buckets, and keeps only the language, when skipped", async () => {
    const onDone = openWizard();

    await userEvent.click(screen.getByRole("radio", { name: "Français" }));
    await userEvent.click(screen.getByRole("radio", { name: "Euro" }));
    await userEvent.click(screen.getByRole("button", { name: "Passer la configuration" }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(localStorage.getItem("settings.language")).toBe("fr");
    expect(localStorage.getItem("settings.currency")).toBeNull();
    expect(JSON.parse(localStorage.getItem("categoryLists") || "")).toEqual({
      expense: [],
      income: [],
    });
    expect(JSON.parse(localStorage.getItem("buckets") || "")).toEqual({});
    expect(localStorage.getItem("onboarding.completed")).toBe("1");
  });
});
