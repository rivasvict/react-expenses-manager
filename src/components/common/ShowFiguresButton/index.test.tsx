import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShowFiguresButton from "./index";
import { PrivacyProvider, usePrivacy } from "../../../privacy";
import { PRIVACY_MODE_STORAGE_KEY } from "../../../privacy/privacyPreference";

const State = () => <p>{usePrivacy().hidden ? "hidden" : "shown"}</p>;

describe("ShowFiguresButton", () => {
  beforeEach(() => localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on"));
  afterEach(() => localStorage.clear());

  it("shows the figures when tapped", async () => {
    const user = userEvent.setup();
    render(
      <PrivacyProvider>
        <ShowFiguresButton />
        <State />
      </PrivacyProvider>
    );

    expect(screen.getByText("hidden")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show figures" }));

    expect(screen.getByText("shown")).toBeInTheDocument();
  });
});
