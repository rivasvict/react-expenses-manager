import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrivacyEye from "./index";
import { PrivacyProvider } from "../../../privacy";
import { PRIVACY_MODE_STORAGE_KEY } from "../../../privacy/privacyPreference";

const renderEye = () =>
  render(
    <PrivacyProvider>
      <PrivacyEye after="Savings" />
    </PrivacyProvider>
  );

describe("PrivacyEye", () => {
  beforeEach(() => localStorage.clear());

  it("renders nothing while Privacy mode is off", () => {
    renderEye();

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("offers to show the figures while they are hidden, and to hide them once shown", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const user = userEvent.setup();
    renderEye();

    await user.click(screen.getByRole("button", { name: "Show figures" }));
    await user.click(screen.getByRole("button", { name: "Hide figures" }));

    expect(
      screen.getByRole("button", { name: "Show figures" })
    ).toBeInTheDocument();
  });
});
