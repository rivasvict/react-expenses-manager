import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AccountChip from "./index";
import { SyncSession } from "../../../services/session";

// The real `getInitials` is used on purpose: the initials shown in the chip
// are part of what this component promises, not an injected detail.
const session: SyncSession = {
  token: "token.signature",
  user: {
    id: "user-1",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
  },
};

const renderChip = (chipSession: SyncSession | null) =>
  render(
    <MemoryRouter>
      <AccountChip session={chipSession} />
    </MemoryRouter>
  );

describe("AccountChip", () => {
  it("renders the anonymous glyph and a plain label when logged out", () => {
    renderChip(null);

    const chip = screen.getByRole("link", { name: "Account" });
    expect(chip).toBeInTheDocument();
    expect(chip).not.toHaveClass("account-chip--logged-in");
    // The glyph is `aria-hidden`, so no accessible query reaches it and the
    // markup is the only way to assert it rendered (same approach as
    // src/integrationTests/balanceChart.test.tsx uses for the chart canvas).
    // eslint-disable-next-line testing-library/no-node-access
    expect(chip.querySelector(".account-chip__icon")).toBeInTheDocument();
    expect(chip).toHaveTextContent("");
  });

  it("renders the user's initials and a named label when logged in", () => {
    renderChip(session);

    const chip = screen.getByRole("link", { name: "Account: Jane Doe" });
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass("account-chip--logged-in");
    expect(chip).toHaveTextContent("JD");
    // eslint-disable-next-line testing-library/no-node-access
    expect(chip.querySelector(".account-chip__icon")).not.toBeInTheDocument();
  });

  it("links to /account whether or not there is a session", () => {
    const { unmount } = renderChip(null);
    expect(screen.getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/account"
    );
    unmount();

    renderChip(session);
    expect(
      screen.getByRole("link", { name: "Account: Jane Doe" })
    ).toHaveAttribute("href", "/account");
  });
});
