import React from "react";
import { render, screen } from "@testing-library/react";
import MemberRow from "./MemberRow";
import { PartyMember } from "../../services/syncApi/contract";

/**
 * Unit tests for one member list row (docs/multi-user-sync/DESIGN.md §3.2).
 * The row's whole job is showing who someone is and what their standing in
 * the party is, so these pin which status it shows when.
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
