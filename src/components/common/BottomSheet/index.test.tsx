import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BottomSheet from "./index";

const renderSheet = (onClose: () => void) =>
  render(
    <BottomSheet title="Pick one" closeLabel="Close" onClose={onClose}>
      <p>Body</p>
    </BottomSheet>,
  );

describe("BottomSheet", () => {
  it("is a dialog named by its heading, with the heading focused", () => {
    renderSheet(jest.fn());

    const dialog = screen.getByRole("dialog", { name: "Pick one" });
    expect(dialog).toHaveTextContent("Body");
    expect(screen.getByRole("heading", { name: "Pick one" })).toHaveFocus();
  });

  it("closes from the close button", async () => {
    const onClose = jest.fn();
    renderSheet(onClose);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", async () => {
    const onClose = jest.fn();
    renderSheet(onClose);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from a tap on the scrim", async () => {
    const onClose = jest.fn();
    renderSheet(onClose);

    await userEvent.click(screen.getByTestId("bottom-sheet-scrim"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
