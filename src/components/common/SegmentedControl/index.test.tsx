import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SegmentedControl from ".";

const options = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

describe("SegmentedControl", () => {
  it("marks the current option and reports another pick", async () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        label="Language"
        name="language"
        options={options}
        value="en"
        onChange={onChange}
      />
    );

    expect(screen.getByRole("radiogroup", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "English" })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: "Español" }));
    expect(onChange).toHaveBeenCalledWith("es");
  });
});
