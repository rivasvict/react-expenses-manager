import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PartyDetailView from "./PartyDetailView";
import { Party, PartyMember } from "../../services/syncApi/contract";

/**
 * Unit tests for the party detail view (docs/multi-user-sync/DESIGN.md
 * §3.2/§3.3). The behaviour worth pinning is the organizer/member split: a
 * member must never be shown controls they cannot use (AC-2.12,
 * docs/multi-user-sync/PRD.md).
 */

const jane: PartyMember = {
  id: "u1",
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  blocked: false,
};

const tom: PartyMember = {
  id: "u2",
  firstName: "Tom",
  lastName: "Doe",
  email: "tom@example.com",
  blocked: false,
};

const party: Party = {
  id: "party-1",
  name: "Jane's Party",
  organizerId: jane.id,
  canceled: false,
  youAreBlocked: false,
  members: [jane, tom],
};

const renderView = (overrides: Partial<Party> = {}, selfId = jane.id) =>
  render(
    <MemoryRouter>
      <PartyDetailView party={{ ...party, ...overrides }} selfId={selfId} />
    </MemoryRouter>
  );

it("names the party", () => {
  renderView();

  expect(
    screen.getByRole("heading", { name: "Jane's Party" })
  ).toBeInTheDocument();
});

it("lists every member", () => {
  renderView();

  expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
  expect(screen.getByText(/Tom Doe/)).toBeInTheDocument();
});

it("offers the organizer the invite action", () => {
  renderView();

  expect(
    screen.getByRole("link", { name: "Add a member" })
  ).toBeInTheDocument();
});

it("hides the invite action from a member and says who can invite", () => {
  renderView({}, tom.id);

  // AC-2.12: the control is absent, not merely disabled — and the copy names
  // the organizer so the member knows who to ask.
  expect(
    screen.queryByRole("link", { name: "Add a member" })
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Only Jane, the/)).toBeInTheDocument();
});

it("falls back to 'the organizer' when the organizer is not in the member list", () => {
  // Defensive: the copy must still read as a sentence rather than "Only ,".
  renderView({ organizerId: "missing-user" }, tom.id);

  expect(screen.getByText(/Only the organizer, the/)).toBeInTheDocument();
});

it("prompts a lone organizer to invite someone", () => {
  renderView({ members: [jane] });

  expect(
    screen.getByText("Invite family members to start syncing.")
  ).toBeInTheDocument();
});

it("drops the invite prompt once the party has other members", () => {
  renderView();

  expect(
    screen.queryByText("Invite family members to start syncing.")
  ).not.toBeInTheDocument();
});

it("passes each member their own role and identity", () => {
  renderView();

  // Jane is the viewer and the organizer; Tom is neither. The row-level
  // flags being derived from the party rather than the caller is what makes
  // this hold.
  expect(screen.getByText("(you)")).toBeInTheDocument();
  expect(screen.getAllByText("Organizer")).toHaveLength(2); // badge + header
});
