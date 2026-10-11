import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSheet from "./index";
import { LanguageProvider } from "../../../i18n";

const renderSheet = (onClose: () => void) =>
  render(
    <LanguageProvider>
      <LanguageSheet onClose={onClose} />
    </LanguageProvider>,
  );

describe("LanguageSheet", () => {
  beforeEach(() => localStorage.clear());

  it("marks the current language and glosses the others", () => {
    renderSheet(jest.fn());

    expect(screen.getByRole("radio", { name: /English/ })).toBeChecked();
    expect(screen.getByText("Spanish")).toBeInTheDocument();
    expect(screen.getByText("French")).toBeInTheDocument();
  });

  it("switches the language and closes when one is picked", async () => {
    const onClose = jest.fn();
    renderSheet(onClose);

    await userEvent.click(screen.getByRole("radio", { name: /Français/ }));

    expect(screen.getByRole("dialog", { name: "Langue" })).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
