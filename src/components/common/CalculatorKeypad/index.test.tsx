import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalculatorKeypad from "./index";
import { LanguageProvider } from "../../../i18n";
import { LANGUAGE_STORAGE_KEY } from "../../../i18n/languagePreference";

const renderKeypad = (props = {}) => {
  const handlers = {
    onKey: jest.fn(),
    onBackspace: jest.fn(),
    onClear: jest.fn(),
  };
  render(
    <LanguageProvider>
      <CalculatorKeypad expression="" {...handlers} {...props} />
    </LanguageProvider>
  );
  return handlers;
};

describe("CalculatorKeypad", () => {
  beforeEach(() => localStorage.clear());

  it("renders the sixteen keys of the calculator grid", () => {
    renderKeypad();

    const keypad = screen.getByRole("group", { name: "Calculator keypad" });
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach((digit) =>
      expect(screen.getByRole("button", { name: digit })).toBeInTheDocument()
    );
    ["Plus", "Minus", "Multiply", "Divide", "Equals", "Decimal point"].forEach(
      (name) => expect(screen.getByRole("button", { name })).toBeInTheDocument()
    );
    expect(keypad).toBeInTheDocument();
  });

  it("reports each key, backspace and clear", async () => {
    const user = userEvent.setup();
    const { onKey, onBackspace, onClear } = renderKeypad();

    await user.click(screen.getByRole("button", { name: "7" }));
    await user.click(screen.getByRole("button", { name: "Multiply" }));
    await user.click(screen.getByRole("button", { name: "Equals" }));
    await user.click(
      screen.getByRole("button", { name: "Delete last character" })
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(onKey.mock.calls).toEqual([["7"], ["*"], ["="]]);
    expect(onBackspace).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("never submits the surrounding form", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <CalculatorKeypad
          expression=""
          onKey={() => {}}
          onBackspace={() => {}}
          onClear={() => {}}
        />
      </form>
    );

    await user.click(screen.getByRole("button", { name: "Equals" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("prints the calculation with math symbols and previews its result", () => {
    renderKeypad({ expression: "12+3*2-1/4", preview: "17.75" });

    const readout = screen.getByRole("status", { name: "Calculation" });
    expect(readout).toHaveTextContent("12 + 3 × 2 − 1 ÷ 4");
    expect(readout).toHaveTextContent("= 17.75");
  });

  it("shows 0 and no preview for an empty or plain-number calculation", () => {
    renderKeypad({ expression: "42", preview: "42" });

    const readout = screen.getByRole("status", { name: "Calculation" });
    expect(readout).toHaveTextContent(/^42$/);
  });

  it("announces an error", () => {
    renderKeypad({ error: "Can't divide by zero" });

    expect(screen.getByRole("alert")).toHaveTextContent("Can't divide by zero");
  });

  it("labels its keys in the stored language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    renderKeypad();

    expect(screen.getByRole("button", { name: "Multiplicar" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Teclado de calculadora" })
    ).toBeInTheDocument();
  });
});
