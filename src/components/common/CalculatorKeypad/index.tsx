import React from "react";
import { Icon } from "@iconify/react";
import backspaceIcon from "@iconify-icons/codicon/arrow-left";
import {
  CalculatorKey,
  hasPendingOperation,
  isOperator,
} from "../../../helpers/calculatorHelper/calculatorHelper";
import { TranslationKey, useTranslation } from "../../../i18n";
import "./styles.scss";

// Row by row, the same order as a phone calculator's operator column.
const KEY_ROWS: CalculatorKey[][] = [
  ["1", "2", "3", "+"],
  ["4", "5", "6", "-"],
  ["7", "8", "9", "*"],
  [".", "0", "=", "/"],
];

// Spoken names for the keys whose glyph a screen reader reads poorly.
const KEY_LABELS: Partial<Record<CalculatorKey, TranslationKey>> = {
  "+": "calculator.plus",
  "-": "calculator.minus",
  "*": "calculator.multiply",
  "/": "calculator.divide",
  "=": "calculator.equals",
  ".": "calculator.decimalPoint",
};

// The display spells operators the way they are printed, not typed.
const prettifyExpression = (expression: string): string =>
  expression
    .replace(/(?!^)-/g, " − ")
    .replace(/\+/g, " + ")
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ");

const keyModifier = (key: CalculatorKey): string => {
  if (key === "=") return "calculator-keypad__key--equals";
  return isOperator(key) ? "calculator-keypad__key--operator" : "";
};

type CalculatorKeypadProps = {
  id?: string;
  expression: string;
  /** The evaluated expression, shown as a preview while an operation is pending. */
  preview?: string;
  error?: string;
  onKey: (key: CalculatorKey) => void;
  onBackspace: () => void;
  onClear: () => void;
};

/**
 * On-screen calculator for amount fields: a display of the calculation typed
 * so far and a 4×4 key grid. Purely presentational — the caller owns the
 * expression (see AmountInput). Every key is a type="button" so pressing one
 * never submits the surrounding form.
 */
const CalculatorKeypad = ({
  id,
  expression,
  preview,
  error,
  onKey,
  onBackspace,
  onClear,
}: CalculatorKeypadProps) => {
  const { t } = useTranslation();
  const showPreview = Boolean(preview) && hasPendingOperation(expression);

  return (
    <div
      id={id}
      className="calculator-keypad"
      role="group"
      aria-label={t("calculator.keypad")}
    >
      <div className="calculator-keypad__display">
        <div
          className="calculator-keypad__readout"
          aria-label={t("calculator.calculation")}
          aria-live="polite"
          role="status"
        >
          <span
            className={`calculator-keypad__expression${
              expression ? "" : " calculator-keypad__expression--empty"
            }`}
          >
            {expression ? prettifyExpression(expression) : "0"}
          </span>
          {showPreview && (
            <span className="calculator-keypad__preview">= {preview}</span>
          )}
        </div>
        <button
          type="button"
          className="calculator-keypad__action"
          onClick={onClear}
          aria-label={t("calculator.clear")}
          title={t("calculator.clear")}
        >
          C
        </button>
        <button
          type="button"
          className="calculator-keypad__action"
          onClick={onBackspace}
          aria-label={t("calculator.backspace")}
          title={t("calculator.backspace")}
        >
          <Icon icon={backspaceIcon} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <div className="calculator-keypad__error" role="alert">
          {error}
        </div>
      )}
      <div className="calculator-keypad__grid">
        {KEY_ROWS.flat().map((key) => {
          const labelKey = KEY_LABELS[key];
          return (
            <button
              key={key}
              type="button"
              className={`calculator-keypad__key ${keyModifier(key)}`}
              onClick={() => onKey(key)}
              aria-label={labelKey ? t(labelKey) : undefined}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalculatorKeypad;
