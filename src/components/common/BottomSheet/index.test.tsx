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

describe("BottomSheet options", () => {
  it("puts an eyebrow inside the heading and can be an alertdialog", () => {
    render(
      <BottomSheet
        title="Eating out"
        eyebrow="Expense category"
        role="alertdialog"
        closeLabel="Close"
        onClose={jest.fn()}
      >
        <p>Body</p>
      </BottomSheet>,
    );

    expect(
      screen.getByRole("alertdialog", { name: "Expense category Eating out" }),
    ).toBeInTheDocument();
  });

  it("keeps a footer apart from the scrolling body", () => {
    render(
      <BottomSheet
        title="Tall"
        variant="tall"
        closeLabel="Close"
        onClose={jest.fn()}
        footer={<button type="button">Confirm</button>}
      >
        <p>Body</p>
      </BottomSheet>,
    );

    // The body and footer are layout wrappers without roles of their own.
    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getByText("Body").parentElement).toHaveClass("bottom-sheet__body");
    // eslint-disable-next-line testing-library/no-node-access
    expect(screen.getByRole("button", { name: "Confirm" }).parentElement).toHaveClass(
      "bottom-sheet__footer",
    );
    expect(screen.getByRole("dialog")).toHaveClass("bottom-sheet__panel--tall");
  });

  it("focuses the given element instead of the heading", () => {
    const inputRef = React.createRef<HTMLInputElement>();
    render(
      <BottomSheet
        title="Add"
        closeLabel="Close"
        onClose={jest.fn()}
        initialFocusRef={inputRef}
      >
        <input aria-label="Name" ref={inputRef} />
      </BottomSheet>,
    );

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveFocus();
  });
});
