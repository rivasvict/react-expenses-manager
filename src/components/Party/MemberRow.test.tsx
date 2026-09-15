import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemberRow from "./MemberRow";
import { PartyMember } from "../../services/syncApi/contract";

/**
 * Unit tests for one member list row (docs/multi-user-sync/DESIGN.md §3.2).
 * The row's whole job is showing who someone is and what their standing in
 * the party is, so these pin which status it shows when — including when
 * the Block button (AC-2.9, docs/multi-user-sync/PRD.md) is offered.
 */

const tom: PartyMember = {
  id: "u2",
  firstName: "Tom",
  lastName: "Doe",
  email: "tom@example.com",
  blocked: false,
};

const renderRow = (props: Partial<React.ComponentProps<typeof MemberRow>> = {}) =>
  render(
    <ul>
      <MemberRow member={tom} isSelf={false} isOrganizer={false} {...props} />
    </ul>
  );

it("shows the member's full name and email", () => {
  renderRow();

  expect(screen.getByText(/Tom Doe/)).toBeInTheDocument();
  expect(screen.getByText("tom@example.com")).toBeInTheDocument();
});

it("marks the viewer's own row with (you)", () => {
  renderRow({ isSelf: true });

  expect(screen.getByText("(you)")).toBeInTheDocument();
});

it("does not mark other people's rows with (you)", () => {
  renderRow();

  expect(screen.queryByText("(you)")).not.toBeInTheDocument();
});

it("badges the organizer", () => {
  renderRow({ isOrganizer: true });

  expect(screen.getByText("Organizer")).toBeInTheDocument();
});

it("labels a blocked member", () => {
  renderRow({ member: { ...tom, blocked: true } });

  expect(screen.getByText("Blocked")).toBeInTheDocument();
});

it("shows no status at all for an ordinary active member", () => {
  renderRow();

  expect(screen.queryByText("Organizer")).not.toBeInTheDocument();
  expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
});

it("shows the Organizer badge rather than Blocked for a blocked organizer", () => {
  // Both statuses occupy the same slot. Which one wins has to be decided
  // rather than left to render order, since the two would otherwise stack.
  renderRow({ member: { ...tom, blocked: true }, isOrganizer: true });

  expect(screen.getByText("Organizer")).toBeInTheDocument();
  expect(screen.queryByText("Blocked")).not.toBeInTheDocument();
});

it("offers a Block button for an active member when the viewer may block", () => {
  renderRow({ onBlock: jest.fn() });

  // Named after the member, so a screen-reader user hears who they are
  // about to block rather than a bare "Block" per row.
  expect(
    screen.getByRole("button", { name: "Block Tom Doe" })
  ).toBeInTheDocument();
});

it("calls back when Block is clicked", async () => {
  const onBlock = jest.fn();
  renderRow({ onBlock });

  await userEvent.click(screen.getByRole("button", { name: "Block Tom Doe" }));

  expect(onBlock).toHaveBeenCalledTimes(1);
});

it("offers no Block button when the viewer may not block", () => {
  // The member view (AC-2.12): the control is absent, not merely inert.
  renderRow();

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("offers no Block button for an already-blocked member", () => {
  renderRow({ member: { ...tom, blocked: true }, onBlock: jest.fn() });

  expect(screen.getByText("Blocked")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("offers no Block button for the organizer, even when allowed to block", () => {
  // The organizer can never be blocked, so their row never offers it —
  // whatever the caller passes.
  renderRow({ isOrganizer: true, onBlock: jest.fn() });

  expect(screen.getByText("Organizer")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
