import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AmountInput from "./index";

// Stateful harness mirroring how the entry forms own the amount.
const ControlledAmount = ({
  initialValue = "",
  defaultKeypadOpen = true,
}: {
  initialValue?: string;
  defaultKeypadOpen?: boolean;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <AmountInput
      id="amount"
      name="amount"
      placeholder="Amount"
      value={value}
      onValueChange={setValue}
      defaultKeypadOpen={defaultKeypadOpen}
    />
  );
};

const amountField = () => screen.getByPlaceholderText("Amount");
const press = async (user: ReturnType<typeof userEvent.setup>, names: string[]) => {
  for (const name of names) {
    await user.click(screen.getByRole("button", { name }));
  }
};

describe("AmountInput", () => {
  it("writes digits pressed on the keypad into the amount", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount />);

    await press(user, ["1", "2", "Decimal point", "5"]);

    expect(amountField()).toHaveValue(12.5);
  });

  it("keeps the amount at the calculation's result, even before =", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount />);

    await press(user, ["1", "2", "Plus", "8"]);
    expect(amountField()).toHaveValue(20);

    await press(user, ["Multiply", "2"]);
    expect(amountField()).toHaveValue(28);

    await press(user, ["Equals"]);
    expect(amountField()).toHaveValue(28);
    expect(screen.getByRole("status", { name: "Calculation" })).toHaveTextContent(
      /^28$/
    );
  });

  it("starts a new number after = unless an operator continues the result", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount />);

    await press(user, ["6", "Plus", "4", "Equals", "3"]);
    expect(amountField()).toHaveValue(3);

    await press(user, ["Plus", "2", "Equals", "Divide", "5", "Equals"]);
    expect(amountField()).toHaveValue(1);
  });

  it("continues from the amount already in the field", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount initialValue="100" />);

    await press(user, ["Minus", "2", "5"]);

    expect(amountField()).toHaveValue(75);
  });

  it("supports backspace and clear", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount />);

    await press(user, ["4", "5", "Delete last character"]);
    expect(amountField()).toHaveValue(4);

    await press(user, ["Clear"]);
    expect(amountField()).toHaveValue(null);
  });

  it("refuses to divide by zero and keeps the last good amount", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount />);

    await press(user, ["9", "Divide", "0"]);
    expect(amountField()).toHaveValue(9);

    await press(user, ["Equals"]);
    expect(screen.getByRole("alert")).toHaveTextContent("Can't divide by zero");
    expect(amountField()).toHaveValue(9);
  });

  it("restarts the calculation from what is typed into the field", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount />);

    await user.type(amountField(), "30");
    await press(user, ["Plus", "5"]);

    expect(amountField()).toHaveValue(35);
  });

  it("toggles the keypad and suppresses the phone keyboard while it is open", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount defaultKeypadOpen={false} />);

    const toggle = screen.getByRole("button", { name: "Show calculator" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(amountField()).toHaveAttribute("inputmode", "decimal");

    await user.click(toggle);

    expect(
      screen.getByRole("button", { name: "Hide calculator" })
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("group", { name: "Calculator keypad" })
    ).toBeInTheDocument();
    expect(amountField()).toHaveAttribute("inputmode", "none");
  });
});
