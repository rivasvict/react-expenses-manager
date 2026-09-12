import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import PartyDetailView from "./PartyDetailView";
import { Party, PartyMember } from "../../services/syncApi/contract";

/**
 * Unit tests for the party detail view (docs/multi-user-sync/DESIGN.md
 * §3.2/§3.3). The behaviour worth pinning is the organizer/member split: a
 * member must never be shown controls they cannot use (AC-2.12,
 * docs/multi-user-sync/PRD.md) — and the organizer must be shown Block on
 * every row but their own (AC-2.9) and Cancel party (AC-2.10).
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

const sam: PartyMember = {
  id: "u3",
  firstName: "Sam",
  lastName: "Doe",
  email: "sam@example.com",
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

interface RenderOptions {
  overrides?: Partial<Party>;
  selfId?: string;
  error?: string | null;
  onBlockClick?: jest.Mock;
  onCancelClick?: jest.Mock;
}

const renderView = ({
  overrides = {},
  selfId = jane.id,
  error = null,
  onBlockClick = jest.fn(),
  onCancelClick = jest.fn(),
}: RenderOptions = {}) =>
  render(
    <MemoryRouter>
      <PartyDetailView
        party={{ ...party, ...overrides }}
        selfId={selfId}
        error={error}
        onBlockClick={onBlockClick}
        onCancelClick={onCancelClick}
      />
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
  renderView({ selfId: tom.id });

  // AC-2.12: the control is absent, not merely disabled — and the copy names
  // the organizer so the member knows who to ask.
  expect(
    screen.queryByRole("link", { name: "Add a member" })
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Only Jane, the/)).toBeInTheDocument();
});

it("falls back to 'the organizer' when the organizer is not in the member list", () => {
  // Defensive: the copy must still read as a sentence rather than "Only ,".
  renderView({ overrides: { organizerId: "missing-user" }, selfId: tom.id });

  expect(screen.getByText(/Only the organizer, the/)).toBeInTheDocument();
});

it("prompts a lone organizer to invite someone", () => {
  renderView({ overrides: { members: [jane] } });

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

describe("blocking (AC-2.9)", () => {
  it("offers the organizer a Block button on every other active row, never their own", () => {
    renderView({ overrides: { members: [jane, tom, sam] } });

    expect(
      screen.getByRole("button", { name: "Block Tom Doe" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Block Sam Doe" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Block Jane Doe" })
    ).not.toBeInTheDocument();
  });

  it("hands the clicked member to onBlockClick", async () => {
    const onBlockClick = jest.fn();
    renderView({ onBlockClick });

    await userEvent.click(screen.getByRole("button", { name: "Block Tom Doe" }));

    // The whole member, not just an id: the hub's confirmation names them.
    expect(onBlockClick).toHaveBeenCalledWith(tom);
  });

  it("offers no Block button for an already-blocked member", () => {
    renderView({ overrides: { members: [jane, { ...tom, blocked: true }] } });

    expect(screen.getByText("Blocked")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Block Tom Doe" })
    ).not.toBeInTheDocument();
  });

  it("offers a member no Block buttons at all (AC-2.12)", () => {
    renderView({ overrides: { members: [jane, tom, sam] }, selfId: tom.id });

    expect(
      screen.queryByRole("button", { name: /^Block / })
    ).not.toBeInTheDocument();
  });
});

describe("cancelling (AC-2.10)", () => {
  it("offers the organizer the Cancel party action and calls back on click", async () => {
    const onCancelClick = jest.fn();
    renderView({ onCancelClick });

    await userEvent.click(screen.getByRole("button", { name: "Cancel party" }));

    expect(onCancelClick).toHaveBeenCalledTimes(1);
  });

  it("hides Cancel party from a member (AC-2.12)", () => {
    renderView({ selfId: tom.id });

    expect(
      screen.queryByRole("button", { name: "Cancel party" })
    ).not.toBeInTheDocument();
  });
});

describe("failures", () => {
  it("announces a block or cancel failure to assistive technology", async () => {
    renderView({ error: "Only the organizer can block members." });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only the organizer can block members."
    );
  });

  it("shows no error region before anything has failed", () => {
    renderView();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
