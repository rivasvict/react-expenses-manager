import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BucketRow from ".";

const renderRow = (props = {}) => {
  const handlers = { onToggle: jest.fn(), onLimitChange: jest.fn() };
  render(
    <BucketRow
      name="Food"
      ticked={false}
      limit=""
      limitLabel="Monthly limit for Food"
      limitPlaceholder="Limit"
      {...handlers}
      {...props}
    />
  );
  return handlers;
};

describe("BucketRow", () => {
  it("toggles through its checkbox", async () => {
    const { onToggle } = renderRow();
    await userEvent.click(screen.getByRole("checkbox", { name: "Food" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("reports what is typed in the limit field", async () => {
    const { onLimitChange } = renderRow();
    await userEvent.type(screen.getByRole("textbox", { name: "Monthly limit for Food" }), "4");
    expect(onLimitChange).toHaveBeenCalledWith("4");
  });

  it("shows an error under the row and marks the field invalid", () => {
    renderRow({ ticked: true, limit: "0", error: "Allowance must be greater than zero" });
    expect(screen.getByRole("alert")).toHaveTextContent("Allowance must be greater than zero");
    expect(screen.getByRole("textbox", { name: "Monthly limit for Food" })).toHaveAttribute(
      "aria-invalid",
      "true"
    );
  });
});
