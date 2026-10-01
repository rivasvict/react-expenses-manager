import { screen } from "@testing-library/react";
import { UserEvent } from "@testing-library/user-event";
import { renderApp } from "./helpers/renderApp";
import { selectCategory } from "./helpers/categorySelect";

/**
 * The calculator keypad under the amount field of the add/edit entry form:
 * it appears when the field is tapped and goes away when focus leaves it, a
 * sum typed on the keypad becomes the saved amount, and editing continues
 * from the stored amount.
 */

const PINNED_DATE = new Date("2026-05-15T12:00:00Z");

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(PINNED_DATE);
});

afterEach(() => {
  jest.useRealTimers();
});

const pressKeys = async (user: UserEvent, names: string[]) => {
  for (const name of names) {
    await user.click(screen.getByRole("button", { name }));
  }
};

describe("amount calculator keypad", () => {
  it("user can add up an expense on the keypad and save the total", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    await user.click(await screen.findByPlaceholderText(/insert expense amount/i));

    // 12.5 + 7.5 × 2 = 27.5
    await pressKeys(user, [
      "1", "2", "Decimal point", "5",
      "Plus", "7", "Decimal point", "5",
      "Multiply", "2",
    ]);
    expect(screen.getByRole("status", { name: "Calculation" })).toHaveTextContent(
      "12.5 + 7.5 × 2= 27.5"
    );
    await pressKeys(user, ["Equals"]);
    expect(screen.getByPlaceholderText(/insert expense amount/i)).toHaveValue(27.5);

    await selectCategory(user, "Eating out");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText("$27.50")).toBeInTheDocument();
  });

  it("user can adjust an existing entry's amount from the keypad", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add income/i }));
    await user.click(await screen.findByPlaceholderText(/insert income amount/i));
    await pressKeys(user, ["1", "0", "0", "0"]);
    await user.type(screen.getByPlaceholderText(/description/i), "Pay");
    await selectCategory(user, "Salary");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await user.click(await screen.findByText("Incomes"));
    await user.click(await screen.findByText(/pay/i));

    // The keypad picks up the stored amount: 1000 − 250 = 750.
    const amountField = await screen.findByPlaceholderText(/insert income amount/i);
    expect(amountField).toHaveValue(1000);
    await user.click(amountField);
    await pressKeys(user, ["Minus", "2", "5", "0"]);
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect((await screen.findAllByText("$750.00")).length).toBeGreaterThan(0);
    expect(screen.queryByText("$1,000.00")).not.toBeInTheDocument();
  });

  it("the keypad appears while the amount field has focus and hides when it leaves", async () => {
    const { user } = await renderApp("/");

    await user.click(await screen.findByRole("link", { name: /add expenses/i }));
    const amountField = await screen.findByPlaceholderText(/insert expense amount/i);
    expect(
      screen.queryByRole("group", { name: "Calculator keypad" })
    ).not.toBeInTheDocument();

    await user.click(amountField);
    expect(
      screen.getByRole("group", { name: "Calculator keypad" })
    ).toBeInTheDocument();
    await pressKeys(user, ["1", "8", "Plus", "2"]);

    // Moving on to the description closes the keypad and keeps the total.
    await user.click(screen.getByPlaceholderText(/description/i));
    expect(
      screen.queryByRole("group", { name: "Calculator keypad" })
    ).not.toBeInTheDocument();
    expect(amountField).toHaveValue(20);

    await selectCategory(user, "Food");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText("$20.00")).toBeInTheDocument();
  });
});
