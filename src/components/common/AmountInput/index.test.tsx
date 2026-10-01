import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AmountInput from "./index";

// Stateful harness mirroring how the entry forms own the amount.
const ControlledAmount = ({ initialValue = "" }: { initialValue?: string }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <AmountInput
        id="amount"
        name="amount"
        placeholder="Amount"
        value={value}
        onValueChange={setValue}
      />
      <input aria-label="Next field" />
    </>
  );
};

const amountField = () => screen.getByPlaceholderText("Amount");
const keypad = () => screen.queryByRole("group", { name: "Calculator keypad" });

// Every scenario starts the way a user does: by tapping the amount field.
const renderFocused = async (initialValue?: string) => {
  const user = userEvent.setup();
  render(<ControlledAmount initialValue={initialValue} />);
  await user.click(amountField());
  return { user };
};
const press = async (user: ReturnType<typeof userEvent.setup>, names: string[]) => {
  for (const name of names) {
    await user.click(screen.getByRole("button", { name }));
  }
};

describe("AmountInput", () => {
  it("writes digits pressed on the keypad into the amount", async () => {
    const { user } = await renderFocused();

    await press(user, ["1", "2", "Decimal point", "5"]);

    expect(amountField()).toHaveValue(12.5);
  });

  it("keeps the amount at the calculation's result, even before =", async () => {
    const { user } = await renderFocused();

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
    const { user } = await renderFocused();

    await press(user, ["6", "Plus", "4", "Equals", "3"]);
    expect(amountField()).toHaveValue(3);

    await press(user, ["Plus", "2", "Equals", "Divide", "5", "Equals"]);
    expect(amountField()).toHaveValue(1);
  });

  it("continues from the amount already in the field", async () => {
    const { user } = await renderFocused("100");

    await press(user, ["Minus", "2", "5"]);

    expect(amountField()).toHaveValue(75);
  });

  it("supports backspace and clear", async () => {
    const { user } = await renderFocused();

    await press(user, ["4", "5", "Delete last character"]);
    expect(amountField()).toHaveValue(4);

    await press(user, ["Clear"]);
    expect(amountField()).toHaveValue(null);
  });

  it("refuses to divide by zero and keeps the last good amount", async () => {
    const { user } = await renderFocused();

    await press(user, ["9", "Divide", "0"]);
    expect(amountField()).toHaveValue(9);

    await press(user, ["Equals"]);
    expect(screen.getByRole("alert")).toHaveTextContent("Can't divide by zero");
    expect(amountField()).toHaveValue(9);
  });

  it("restarts the calculation from what is typed into the field", async () => {
    const { user } = await renderFocused();

    await user.type(amountField(), "30");
    await press(user, ["Plus", "5"]);

    expect(amountField()).toHaveValue(35);
  });

  it("shows the keypad only while the field or the keypad has focus", async () => {
    const user = userEvent.setup();
    render(<ControlledAmount />);

    expect(keypad()).not.toBeInTheDocument();

    await user.click(amountField());
    expect(keypad()).toBeInTheDocument();
    // The keypad replaces the phone keyboard.
    expect(amountField()).toHaveAttribute("inputmode", "none");

    // Pressing keys keeps focus in the field, so the keypad stays.
    await press(user, ["4", "Plus", "1"]);
    expect(amountField()).toHaveFocus();
    expect(keypad()).toBeInTheDocument();

    await user.click(screen.getByLabelText("Next field"));
    expect(keypad()).not.toBeInTheDocument();
    expect(amountField()).toHaveValue(5);
  });

  it("stays open while Tab moves focus from the field into the keys", async () => {
    const { user } = await renderFocused();

    await user.tab();
    expect(screen.getByRole("button", { name: "Clear" })).toHaveFocus();
    expect(keypad()).toBeInTheDocument();

    // Leaving the keypad for the next field closes it.
    await user.click(screen.getByLabelText("Next field"));
    expect(keypad()).not.toBeInTheDocument();
  });

  it("restarts from the field's current amount each time it opens", async () => {
    const { user } = await renderFocused("10");

    await press(user, ["Plus", "5", "Equals"]);
    await user.click(screen.getByLabelText("Next field"));
    await user.click(amountField());
    await press(user, ["Multiply", "2"]);

    expect(amountField()).toHaveValue(30);
  });
});
