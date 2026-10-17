import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CategoryRow from ".";

describe("CategoryRow", () => {
  it("is a button named by the category first, then its usage, that opens it", async () => {
    const onOpen = jest.fn();
    render(
      <CategoryRow
        type="expense"
        name="Eating out"
        meta="5 expenses · Bucket $400.00/mo"
        onOpen={onOpen}
      />
    );

    const row = screen.getByRole("button", { name: /^Eating out/ });
    expect(row).toHaveTextContent("Eating out5 expenses · Bucket $400.00/mo");
    expect(row).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.click(row);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("forwards its ref to the button", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<CategoryRow ref={ref} type="income" name="Salary" meta="Not used yet" onOpen={jest.fn()} />);
    expect(ref.current).toBe(screen.getByRole("button"));
  });
});
