import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NoPartyView from "./NoPartyView";

/**
 * Unit tests for the no-party view (docs/multi-user-sync/DESIGN.md §3.1):
 * both ways into a party, where the create error is surfaced, and the
 * status line the blocked/canceled states (§3.6) put on top of it.
 */

const renderView = (props: Partial<React.ComponentProps<typeof NoPartyView>> = {}) =>
  render(
    <MemoryRouter>
      <NoPartyView onCreateClick={jest.fn()} error={null} {...props} />
    </MemoryRouter>
  );

it("offers both creating and joining a party", () => {
  renderView();

  expect(
    screen.getByRole("button", { name: "Create a party" })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Join a party" })).toBeInTheDocument();
});

it("calls back when create is clicked", async () => {
  const onCreateClick = jest.fn();
  renderView({ onCreateClick });

  await userEvent.click(screen.getByRole("button", { name: "Create a party" }));

  expect(onCreateClick).toHaveBeenCalledTimes(1);
});

it("announces a create failure to assistive technology", async () => {
  renderView({ error: "You already belong to a party." });

  // role=alert rather than plain text: the failure happens after a click, so
  // a screen-reader user gets no reason for it unless it is announced.
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "You already belong to a party."
  );
});

it("shows no error region before anything has failed", () => {
  renderView();

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("keeps the create action available after a failure so it can be retried", () => {
  renderView({ error: "Could not create the party." });

  expect(
    screen.getByRole("button", { name: "Create a party" })
  ).toBeEnabled();
});

it("announces the status line as a status region when one is given", () => {
  renderView({ statusLine: "Your party was canceled. Create or join a new one to sync again." });

  // role=status rather than plain text: the reason the user has landed
  // back here is the one thing on the screen that is new to them.
  expect(screen.getByRole("status")).toHaveTextContent(
    "Your party was canceled. Create or join a new one to sync again."
  );
});

it("renders no status region for a plain no-party visitor", () => {
  renderView();

  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("still offers both ways in alongside a status line", () => {
  // Being blocked or canceled leaves the user free to start over (DESIGN
  // §3.6), so the status line must not displace either action.
  renderView({ statusLine: "You've been removed from this party by its organizer." });

  expect(
    screen.getByRole("button", { name: "Create a party" })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Join a party" })).toBeInTheDocument();
});
