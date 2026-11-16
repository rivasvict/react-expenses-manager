import React, { useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import BottomSheet from "../../../BottomSheet";
import { getBucketAllowanceValidationError } from "../../../../../helpers/entriesHelper/entriesHelper";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

const ALLOWANCE_MATCHER = /^-?\d*(\.)*\d+$/;

interface AllowanceSheetProps {
  /** The allowance of the viewed month, the field's starting value. */
  initialValue: number;
  onSave: (allowance: number) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Edits the bucket's monthly allowance from the viewed month onward. A valid
 * amount is saved and the sheet closes; an invalid one stays open with its
 * message under the field.
 */
const AllowanceSheet = ({ initialValue, onSave, onClose }: AllowanceSheetProps) => {
  const translator = useTranslation();
  const { t } = translator;
  const [value, setValue] = useState<number | "">(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const allowanceError = getBucketAllowanceValidationError(value, translator);
    if (allowanceError) {
      setError(allowanceError);
      return;
    }
    await onSave(Number(value));
    onClose();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value;
    setError(null);
    if (!next) {
      setValue("");
      return;
    }
    if (ALLOWANCE_MATCHER.test(next)) setValue(parseFloat(next));
  };

  return (
    <BottomSheet
      className="allowance-sheet"
      title={t("bucketForm.monthlyAllowance")}
      closeLabel={t("editBucket.close")}
      onClose={onClose}
      initialFocusRef={inputRef}
    >
      <Form className="allowance-sheet__content" onSubmit={handleSubmit} noValidate>
        <div>
          <p className="field-hint" id="bucket-amount-hint">
            {t("editBucket.hint")}
          </p>
          <Form.Control
            type="number"
            id="bucket-amount"
            name="amount"
            ref={inputRef}
            aria-describedby="bucket-amount-hint"
            aria-invalid={Boolean(error)}
            className={`text${error ? " allowance-sheet__input--error" : ""}`}
            placeholder={t("bucketForm.amountPlaceholder")}
            value={value}
            onChange={handleChange}
          />
          {error && (
            <p className="validation-message allowance-sheet__error" role="alert">
              {error}
            </p>
          )}
        </div>
        <Button variant="primary" type="submit">
          {t("common.submit")}
        </Button>
        <Button variant="secondary" type="button" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </Form>
    </BottomSheet>
  );
};

export default AllowanceSheet;
