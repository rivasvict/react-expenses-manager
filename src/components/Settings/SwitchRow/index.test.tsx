import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SwitchRow from "./index";

describe("SwitchRow", () => {
  it("is a switch named by its label and hint, reflecting its state", () => {
    render(
      <SwitchRow label="Privacy mode" hint="Blurs figures" checked onChange={jest.fn()} />
    );

    expect(screen.getByRole("switch", { name: /^Privacy mode/ })).toBeChecked();
    expect(screen.getByText("Blurs figures")).toBeInTheDocument();
  });

  it("asks for the opposite value when tapped", async () => {
    const onChange = jest.fn();
    render(
      <SwitchRow label="Privacy mode" hint="Hint" checked={false} onChange={onChange} />
    );

    await userEvent.click(screen.getByRole("switch"));

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
