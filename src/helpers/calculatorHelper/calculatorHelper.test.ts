import {
  appendKey,
  evaluateExpression,
  formatResult,
  hasPendingOperation,
  removeLastKey,
} from "./calculatorHelper";

const press = (keys: string, start = "") =>
  keys.split("").reduce(
    (expression, key) => appendKey(expression, key as any),
    start
  );

describe("appendKey", () => {
  it("builds numbers and operations digit by digit", () => {
    expect(press("12+3.5")).toBe("12+3.5");
  });

  it("ignores an operator with no number before it, except a leading minus", () => {
    expect(press("+")).toBe("");
    expect(press("*")).toBe("");
    expect(press("-")).toBe("-");
    expect(press("-+")).toBe("-");
  });

  it("replaces an operator pressed right after another", () => {
    expect(press("5+-")).toBe("5-");
    expect(press("5*/")).toBe("5/");
  });

  it("allows a single decimal point per number and pads a bare one with 0", () => {
    expect(press("1.2.3")).toBe("1.23");
    expect(press(".5")).toBe("0.5");
    expect(press("2+.5")).toBe("2+0.5");
    expect(press("1.5+2.5")).toBe("1.5+2.5");
  });

  it("replaces a lone leading zero instead of extending it", () => {
    expect(press("07")).toBe("7");
    expect(press("3+07")).toBe("3+7");
    expect(press("0.07")).toBe("0.07");
    expect(press("100")).toBe("100");
  });
});

describe("removeLastKey", () => {
  it("drops the last character", () => {
    expect(removeLastKey("12+3")).toBe("12+");
    expect(removeLastKey("")).toBe("");
  });
});

describe("evaluateExpression", () => {
  it("applies * and / before + and -", () => {
    expect(evaluateExpression("2+3*4")).toEqual({ ok: true, value: 14 });
    expect(evaluateExpression("10-6/2")).toEqual({ ok: true, value: 7 });
    expect(evaluateExpression("8/4*3")).toEqual({ ok: true, value: 6 });
    expect(evaluateExpression("10-2-3")).toEqual({ ok: true, value: 5 });
  });

  it("supports a leading minus", () => {
    expect(evaluateExpression("-5+8")).toEqual({ ok: true, value: 3 });
  });

  it("ignores a trailing operator or decimal point", () => {
    expect(evaluateExpression("12+")).toEqual({ ok: true, value: 12 });
    expect(evaluateExpression("12.")).toEqual({ ok: true, value: 12 });
  });

  it("rounds away floating-point noise", () => {
    expect(evaluateExpression("0.1+0.2")).toEqual({ ok: true, value: 0.3 });
    expect(evaluateExpression("10/3")).toEqual({ ok: true, value: 3.33333333 });
  });

  it("reports an empty expression and division by zero", () => {
    expect(evaluateExpression("")).toEqual({ ok: false, reason: "empty" });
    expect(evaluateExpression("-")).toEqual({ ok: false, reason: "empty" });
    expect(evaluateExpression("5/0")).toEqual({
      ok: false,
      reason: "divisionByZero",
    });
  });
});

describe("formatResult", () => {
  it("renders a plain decimal string", () => {
    expect(formatResult(42)).toBe("42");
    expect(formatResult(12.5)).toBe("12.5");
  });
});

describe("hasPendingOperation", () => {
  it("is true only when an operator follows a number", () => {
    expect(hasPendingOperation("12")).toBe(false);
    expect(hasPendingOperation("-12")).toBe(false);
    expect(hasPendingOperation("12+3")).toBe(true);
    expect(hasPendingOperation("12-")).toBe(true);
  });
});
