import React from "react";
import { render, screen } from "@testing-library/react";
import VersionLabel from ".";
import { LanguageProvider } from "../../../i18n";

const renderLabel = (version?: string) =>
  render(
    <LanguageProvider>
      <VersionLabel version={version} />
    </LanguageProvider>,
  );

describe("VersionLabel", () => {
  it("shows the given version", () => {
    renderLabel("1.2.3");
    expect(screen.getByText("Version 1.2.3")).toBeInTheDocument();
  });

  it("renders nothing when the version is unknown", () => {
    const { container } = renderLabel("");
    expect(container).toBeEmptyDOMElement();
  });
});
