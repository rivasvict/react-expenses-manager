import { screen } from "@testing-library/react";
import { renderApp } from "./helpers/renderApp";
import { pickLanguage } from "./helpers/settings";

beforeEach(() => localStorage.clear());

describe("app version", () => {
  it("shows the app version on Settings, in the chosen language", async () => {
    const { user } = await renderApp("/settings");

    expect(
      await screen.findByText(/^Version \d+\.\d+\.\d+/),
    ).toBeInTheDocument();

    await pickLanguage(user, /Español/);

    expect(
      await screen.findByText(/^Versión \d+\.\d+\.\d+/),
    ).toBeInTheDocument();
  });
});
