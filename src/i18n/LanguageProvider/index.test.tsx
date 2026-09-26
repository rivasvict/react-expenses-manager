import React, { Component } from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  LanguageContextValue,
  LanguageProvider,
  useTranslation,
  withTranslation,
} from "./index";
import { LANGUAGE_STORAGE_KEY } from "../languagePreference";

const Probe = () => {
  const { t, language, setLanguage } = useTranslation();
  return (
    <>
      <p>{t("nav.home")}</p>
      <p data-testid="language">{language}</p>
      <button onClick={() => setLanguage("es")}>switch</button>
    </>
  );
};

class ClassProbe extends Component<LanguageContextValue> {
  render() {
    return <p>{this.props.t("common.cancel")}</p>;
  }
}
const TranslatedClassProbe = withTranslation(ClassProbe);

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
  });

  it("renders English when no language is stored", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("starts in the stored language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("es");
  });

  it("switches language, persists it and updates <html lang>", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    await user.click(screen.getByRole("button", { name: "switch" }));

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("follows a change made in another tab", () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: LANGUAGE_STORAGE_KEY,
          newValue: "es",
        })
      );
    });
    expect(screen.getByTestId("language")).toHaveTextContent("es");
  });

  it("falls back to English without a provider", () => {
    render(<Probe />);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("injects the translator into class components", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    render(
      <LanguageProvider>
        <TranslatedClassProbe />
      </LanguageProvider>
    );
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });
});
