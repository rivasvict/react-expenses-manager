import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeeklyViewSheet from "./index";
import { LanguageProvider } from "../../../i18n";

const renderSheet = (onPick = jest.fn(), onClose = jest.fn()) =>
  render(
    <LanguageProvider>
      <WeeklyViewSheet current="rows" onPick={onPick} onClose={onClose} />
    </LanguageProvider>,
  );

describe("WeeklyViewSheet", () => {
  beforeEach(() => localStorage.clear());

  it("lists the three views with what each looks like, the current one checked", () => {
    renderSheet();

    expect(screen.getByRole("radio", { name: /Week rows/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Weekly bars/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Month line/ })).not.toBeChecked();
    expect(screen.getByText("One line of spending through the month")).toBeInTheDocument();
  });

  it("reports the pick and closes", async () => {
    const onPick = jest.fn();
    const onClose = jest.fn();
    renderSheet(onPick, onClose);

    await userEvent.click(screen.getByRole("radio", { name: /Weekly bars/ }));

    expect(onPick).toHaveBeenCalledWith("bars");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the Close button without picking", async () => {
    const onPick = jest.fn();
    const onClose = jest.fn();
    renderSheet(onPick, onClose);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onPick).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
