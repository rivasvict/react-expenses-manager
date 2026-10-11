import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingRow from "./index";

describe("SettingRow", () => {
  it("shows its label, hint and current value, and opens on tap", async () => {
    const onOpen = jest.fn();
    render(
      <SettingRow
        label="Language"
        hint="Applies right away"
        value="English"
        onOpen={onOpen}
      />,
    );

    const row = screen.getByRole("button", { name: /Language/ });
    expect(row).toHaveTextContent("Applies right away");
    expect(row).toHaveTextContent("English");
    expect(row).toHaveAttribute("aria-haspopup", "dialog");

    await userEvent.click(row);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
