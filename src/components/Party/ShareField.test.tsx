import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareField from "./ShareField";

/**
 * Unit tests for the share field (docs/multi-user-sync/DESIGN.md §3.4). This
 * is how the one-time invitation code and its password leave the app, so the
 * properties under test are that the value is readable but not editable, that
 * a masked value stays hidden until asked for, and that the copy
 * confirmation is announced rather than only drawn.
 */

const renderField = (props: Partial<React.ComponentProps<typeof ShareField>> = {}) =>
  render(
    <ShareField
      label="Code"
      value="K7X9-QP2M"
      copied={false}
      onCopy={jest.fn()}
      {...props}
    />
  );

it("shows the value in a labelled, read-only field", () => {
  renderField();

  const field = screen.getByLabelText("Code");
  expect(field).toHaveValue("K7X9-QP2M");
  // Read-only, not disabled: the text must still be selectable by hand for
  // anyone whose clipboard button does not work.
  expect(field).toHaveAttribute("readonly");
});

it("calls back when the copy button is used", async () => {
  const onCopy = jest.fn();
  renderField({ onCopy });

  await userEvent.click(screen.getByRole("button", { name: "Copy code" }));

  expect(onCopy).toHaveBeenCalledTimes(1);
});

it("announces the copy confirmation in a live region", () => {
  renderField({ copied: true });

  const live = screen.getByRole("status");
  expect(live).toHaveTextContent("Copied");
  expect(live).toHaveAttribute("aria-live", "polite");
});

it("keeps the live region present but empty before a copy", () => {
  renderField();

  // The region has to exist up front; one inserted at copy time may not be
  // announced at all.
  expect(screen.getByRole("status")).toHaveTextContent("");
});

it("shows an unmasked value as plain text", () => {
  renderField();

  expect(screen.getByLabelText("Code")).toHaveAttribute("type", "text");
});

it("masks a masked value until it is revealed", () => {
  renderField({ label: "Password", masked: true, revealed: false, onToggleReveal: jest.fn() });

  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  expect(
    screen.getByRole("button", { name: "Show password" })
  ).toBeInTheDocument();
});

it("unmasks once revealed, and offers to hide again", () => {
  renderField({ label: "Password", masked: true, revealed: true, onToggleReveal: jest.fn() });

  expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
  expect(
    screen.getByRole("button", { name: "Hide password" })
  ).toBeInTheDocument();
});

it("calls back when the reveal toggle is used", async () => {
  const onToggleReveal = jest.fn();
  renderField({ label: "Password", masked: true, onToggleReveal });

  await userEvent.click(screen.getByRole("button", { name: "Show password" }));

  expect(onToggleReveal).toHaveBeenCalledTimes(1);
});

it("offers no reveal toggle for an unmasked field", () => {
  renderField();

  expect(screen.getAllByRole("button")).toHaveLength(1);
});
