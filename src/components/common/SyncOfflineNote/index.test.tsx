import React from "react";
import { render, screen } from "@testing-library/react";
import SyncOfflineNote from "./index";

describe("SyncOfflineNote", () => {
  it("states that the sync server is offline, then explains what it means here", () => {
    render(<SyncOfflineNote>Your party is hidden for now.</SyncOfflineNote>);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sync server is offline",
    );
    expect(
      screen.getByText("Your party is hidden for now."),
    ).toBeInTheDocument();
  });
});
