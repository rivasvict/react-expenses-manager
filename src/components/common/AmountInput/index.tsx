import React, { useState } from "react";
import { Icon } from "@iconify/react";
import calculatorIcon from "@iconify-icons/codicon/symbol-operator";
import { InputNumber } from "../Forms";
import CalculatorKeypad from "../CalculatorKeypad";
import {
  CalculatorKey,
  appendKey,
  evaluateExpression,
  formatResult,
  isOperator,
  removeLastKey,
} from "../../../helpers/calculatorHelper/calculatorHelper";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

// Only a plain decimal can seed the calculation; anything else starts empty.
const toExpression = (value: unknown): string => {
  const text = value === undefined || value === null ? "" : String(value);
  return /^-?\d*\.?\d*$/.test(text) ? text : "";
};

type AmountInputProps = {
  id: string;
  name: string;
  value?: string | number;
  placeholder?: string;
  /** Receives the amount as a plain decimal string ("" when cleared). */
  onValueChange: (value: string) => void;
  /** Whether the keypad starts open. */
  defaultKeypadOpen?: boolean;
};

/**
 * The amount field of every entry form: a number input plus an on-screen
 * calculator keypad. Whatever the keypad computes is written straight into
 * the amount, so "12+8" leaves 20 in the field even without pressing "=",
 * and typing into the field (physical keyboard) restarts the calculation
 * from what was typed. While the keypad is open the phone's own keyboard is
 * suppressed (`inputMode="none"`), so the two never cover each other.
 */
const AmountInput = ({
  id,
  name,
  value,
  placeholder,
  onValueChange,
  defaultKeypadOpen = false,
}: AmountInputProps) => {
  const { t } = useTranslation();
  const [isKeypadOpen, setIsKeypadOpen] = useState(defaultKeypadOpen);
  const [expression, setExpression] = useState(() => toExpression(value));
  // After "=", the next digit starts a new number instead of extending the result.
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const keypadId = `${id}-keypad`;

  const result = evaluateExpression(expression);
  const preview = result.ok ? formatResult(result.value) : undefined;

  const updateExpression = (next: string) => {
    setExpression(next);
    setError(undefined);
    const nextResult = evaluateExpression(next);
    if (nextResult.ok) onValueChange(formatResult(nextResult.value));
    else if (nextResult.reason === "empty") onValueChange("");
    // A pending division by zero ("5/0" on its way to "5/0.5") leaves the
    // amount as it was until the calculation makes sense again.
  };

  const handleKey = (key: CalculatorKey) => {
    if (key === "=") {
      if (!result.ok) {
        if (result.reason === "divisionByZero") {
          setError(t("calculator.divisionByZero"));
        }
        return;
      }
      updateExpression(formatResult(result.value));
      setJustEvaluated(true);
      return;
    }
    const startsNewNumber = justEvaluated && !isOperator(key);
    updateExpression(appendKey(startsNewNumber ? "" : expression, key));
    setJustEvaluated(false);
  };

  const toggleKeypad = () => {
    // Opening picks up whatever is in the field now, typed or not.
    if (!isKeypadOpen) setExpression(toExpression(value));
    setError(undefined);
    setJustEvaluated(false);
    setIsKeypadOpen((open) => !open);
  };

  const toggleLabel = isKeypadOpen ? t("calculator.hide") : t("calculator.show");

  return (
    <div className="amount-input">
      <div className="amount-input__field">
        <InputNumber
          id={id}
          name={name}
          placeholder={placeholder}
          value={value ?? ""}
          inputMode={isKeypadOpen ? "none" : "decimal"}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const typed = event.currentTarget.value;
            setExpression(toExpression(typed));
            setError(undefined);
            setJustEvaluated(false);
            onValueChange(typed);
          }}
        />
        <button
          type="button"
          className={`amount-input__toggle${
            isKeypadOpen ? " amount-input__toggle--active" : ""
          }`}
          onClick={toggleKeypad}
          aria-label={toggleLabel}
          title={toggleLabel}
          aria-expanded={isKeypadOpen}
          aria-controls={keypadId}
        >
          <Icon icon={calculatorIcon} aria-hidden="true" />
        </button>
      </div>
      {isKeypadOpen && (
        <CalculatorKeypad
          id={keypadId}
          expression={expression}
          preview={preview}
          error={error}
          onKey={handleKey}
          onBackspace={() => {
            updateExpression(removeLastKey(expression));
            setJustEvaluated(false);
          }}
          onClear={() => {
            updateExpression("");
            setJustEvaluated(false);
          }}
        />
      )}
    </div>
  );
};

export default AmountInput;
