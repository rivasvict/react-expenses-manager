import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CurrencySheet from "./index";
import { LanguageProvider } from "../../../i18n";

const renderSheet = (onPick = jest.fn(), onClose = jest.fn()) =>
  render(
    <LanguageProvider>
      <CurrencySheet current="USD" onPick={onPick} onClose={onClose} />
    </LanguageProvider>,
  );

describe("CurrencySheet", () => {
  beforeEach(() => localStorage.clear());

  it("shows each currency's symbol and code, named by its full name", () => {
    renderSheet();

    expect(screen.getByRole("radio", { name: "US Dollar" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Euro" })).not.toBeChecked();
    expect(screen.getByText("€")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText("COL$")).toBeInTheDocument();
  });

  it("reports the pick and closes", async () => {
    const onPick = jest.fn();
    const onClose = jest.fn();
    renderSheet(onPick, onClose);

    await userEvent.click(screen.getByRole("radio", { name: "Japanese Yen" }));

    expect(onPick).toHaveBeenCalledWith("JPY");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
