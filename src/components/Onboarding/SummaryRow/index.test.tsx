import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SummaryRow from ".";

describe("SummaryRow", () => {
  it("shows the title and hint and reports an edit", async () => {
    const onEdit = jest.fn();
    render(<SummaryRow title="3 buckets" hint="$1,950.00 a month in total" onEdit={onEdit} />);

    expect(screen.getByText("3 buckets")).toBeInTheDocument();
    expect(screen.getByText("$1,950.00 a month in total")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit 3 buckets" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
