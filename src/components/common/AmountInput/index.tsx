import React, { useState } from "react";
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
};

/**
 * The amount field of every entry form: a number input whose calculator
 * keypad appears while the field has focus and disappears once focus leaves
 * the field and the keypad. Whatever the keypad computes is written straight
 * into the amount, so "12+8" leaves 20 in the field even without pressing
 * "=", and typing into the field (physical keyboard) restarts the
 * calculation from what was typed. The phone's own keyboard is suppressed
 * (`inputMode="none"`) since the keypad takes its place.
 */
const AmountInput = ({
  id,
  name,
  value,
  placeholder,
  onValueChange,
}: AmountInputProps) => {
  const { t } = useTranslation();
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
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

  // `focus`/`blur` here are React's bubbling focusin/focusout, so they cover
  // the input and every keypad key. Moving focus between them (Tab from the
  // field into the keys) keeps the keypad open; leaving the group closes it.
  const handleFocus = () => {
    if (isKeypadOpen) return;
    // Opening picks up whatever is in the field now, typed or not.
    setExpression(toExpression(value));
    setError(undefined);
    setJustEvaluated(false);
    setIsKeypadOpen(true);
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !event.currentTarget.contains(next)) setIsKeypadOpen(false);
  };

  // Pressing a key must not take focus away from the field: some browsers
  // (Safari) never focus a clicked button, so the blur would report no
  // relatedTarget and close the keypad before the click lands. Cancelling
  // mousedown's default action keeps focus where it is in every browser,
  // touch included (taps dispatch mousedown too).
  const keepFocus = (event: React.MouseEvent) => event.preventDefault();

  return (
    <div className="amount-input" onFocus={handleFocus} onBlur={handleBlur}>
      <InputNumber
        id={id}
        name={name}
        placeholder={placeholder}
        value={value ?? ""}
        inputMode="none"
        aria-controls={keypadId}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const typed = event.currentTarget.value;
          setExpression(toExpression(typed));
          setError(undefined);
          setJustEvaluated(false);
          onValueChange(typed);
        }}
      />
      {isKeypadOpen && (
        <div onMouseDown={keepFocus}>
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
        </div>
      )}
    </div>
  );
};

export default AmountInput;
