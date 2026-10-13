import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrivacyProvider, usePrivacy } from "./index";
import { PRIVACY_MODE_STORAGE_KEY } from "../privacyPreference";

const Probe = () => {
  const { enabled, hidden, setEnabled, reveal, hide } = usePrivacy();
  return (
    <>
      <p>{`enabled:${enabled} hidden:${hidden}`}</p>
      <button onClick={() => setEnabled(!enabled)}>toggle</button>
      <button onClick={reveal}>reveal</button>
      <button onClick={hide}>hide</button>
    </>
  );
};

const renderProbe = () =>
  render(
    <PrivacyProvider>
      <Probe />
    </PrivacyProvider>
  );

const setVisibility = (state: "hidden" | "visible") => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

describe("PrivacyProvider", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => setVisibility("visible"));

  it("hides nothing while the mode is off", () => {
    renderProbe();
    expect(screen.getByText("enabled:false hidden:false")).toBeInTheDocument();
  });

  it("starts hidden when the mode is stored as on", () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    renderProbe();
    expect(screen.getByText("enabled:true hidden:true")).toBeInTheDocument();
  });

  it("reveals and hides on request", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByText("reveal"));
    expect(screen.getByText("enabled:true hidden:false")).toBeInTheDocument();

    await user.click(screen.getByText("hide"));
    expect(screen.getByText("enabled:true hidden:true")).toBeInTheDocument();
  });

  it("hides again when the page goes to the background", async () => {
    localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByText("reveal"));

    setVisibility("hidden");

    expect(screen.getByText("enabled:true hidden:true")).toBeInTheDocument();
  });

  it("stores the switch and starts hidden after it is turned on", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByText("toggle"));

    expect(screen.getByText("enabled:true hidden:true")).toBeInTheDocument();
    expect(localStorage.getItem(PRIVACY_MODE_STORAGE_KEY)).toBe("on");
  });

  it("follows a change made in another tab", () => {
    renderProbe();

    act(() => {
      localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, "on");
      window.dispatchEvent(
        new StorageEvent("storage", { key: PRIVACY_MODE_STORAGE_KEY })
      );
    });

    expect(screen.getByText("enabled:true hidden:true")).toBeInTheDocument();
  });
});
