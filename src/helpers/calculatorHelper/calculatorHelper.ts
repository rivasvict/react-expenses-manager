/**
 * Pure logic behind the amount calculator keypad: how each key edits the
 * expression being typed, and how that expression is evaluated. No `eval` —
 * the expression is tokenized and reduced with the usual precedence
 * (`*` and `/` before `+` and `-`), left to right.
 */

export type CalculatorOperator = "+" | "-" | "*" | "/";
export type CalculatorKey =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | CalculatorOperator
  | "=";

export type CalculationResult =
  | { ok: true; value: number; reason?: undefined }
  | { ok: false; value?: undefined; reason: "empty" | "divisionByZero" };

const OPERATORS: CalculatorOperator[] = ["+", "-", "*", "/"];

export const isOperator = (value: string): value is CalculatorOperator =>
  OPERATORS.includes(value as CalculatorOperator);

/** The number being typed at the end of the expression ("" after an operator). */
const trailingNumber = (expression: string): string => {
  const match = expression.match(/[0-9.]*$/);
  return match ? match[0] : "";
};

/**
 * The expression after pressing `key` (anything but "="). Keys that would
 * make it malformed are ignored: an operator with no number before it
 * (except a leading minus), a second decimal point in one number. Pressing an
 * operator right after another replaces it, so a mistyped "+" can be turned
 * into a "-" without backspacing.
 */
export const appendKey = (
  expression: string,
  key: Exclude<CalculatorKey, "=">
): string => {
  const lastChar = expression.slice(-1);

  if (isOperator(key)) {
    if (expression === "" || expression === "-") {
      return key === "-" ? "-" : expression;
    }
    return isOperator(lastChar)
      ? `${expression.slice(0, -1)}${key}`
      : `${expression}${key}`;
  }

  const current = trailingNumber(expression);
  if (key === ".") {
    if (current.includes(".")) return expression;
    return current === "" ? `${expression}0.` : `${expression}.`;
  }
  // A lone leading zero is replaced rather than extended ("0" → "7", not "07").
  if (current === "0") return `${expression.slice(0, -1)}${key}`;
  return `${expression}${key}`;
};

export const removeLastKey = (expression: string): string =>
  expression.slice(0, -1);

const tokenize = (expression: string): Array<number | CalculatorOperator> => {
  const tokens: Array<number | CalculatorOperator> = [];
  let number = "";
  expression.split("").forEach((char, index) => {
    // A minus that opens the expression is the sign of the first number.
    if (isOperator(char) && !(char === "-" && index === 0)) {
      tokens.push(Number(number), char);
      number = "";
    } else {
      number += char;
    }
  });
  tokens.push(Number(number));
  return tokens;
};

/**
 * Money is never finer than a cent's fraction, so floating-point noise
 * (0.1 + 0.2 = 0.30000000000000004) is rounded away.
 */
const roundResult = (value: number): number =>
  Math.round(value * 1e8) / 1e8 || 0;

/**
 * Evaluates the expression. A trailing operator or decimal point is ignored,
 * so "12+" evaluates to 12 — what the amount would be if the user stopped
 * typing there.
 */
export const evaluateExpression = (expression: string): CalculationResult => {
  const complete = expression.replace(/[+\-*/.]+$/, "");
  if (complete === "" || complete === "-") return { ok: false, reason: "empty" };

  const tokens = tokenize(complete);
  // First pass: fold * and / into their left operand.
  const terms: Array<number | CalculatorOperator> = [tokens[0]];
  for (let index = 1; index < tokens.length; index += 2) {
    const operator = tokens[index] as CalculatorOperator;
    const operand = tokens[index + 1] as number;
    if (operator === "*" || operator === "/") {
      const left = terms.pop() as number;
      if (operator === "/" && operand === 0) {
        return { ok: false, reason: "divisionByZero" };
      }
      terms.push(operator === "*" ? left * operand : left / operand);
    } else {
      terms.push(operator, operand);
    }
  }
  // Second pass: + and -, left to right.
  let value = terms[0] as number;
  for (let index = 1; index < terms.length; index += 2) {
    const operand = terms[index + 1] as number;
    value = terms[index] === "+" ? value + operand : value - operand;
  }
  return { ok: true, value: roundResult(value) };
};

/** A result as the plain decimal string the amount input expects. */
export const formatResult = (value: number): string => String(value);

/** Whether the expression has an operation still to resolve (not a plain number). */
export const hasPendingOperation = (expression: string): boolean =>
  /[+*/]/.test(expression) || expression.lastIndexOf("-") > 0;
