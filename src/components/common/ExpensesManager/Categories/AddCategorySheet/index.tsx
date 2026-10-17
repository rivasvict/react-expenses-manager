import React, { useRef, useState } from "react";
import { Button, Form } from "react-bootstrap";
import BottomSheet from "../../../BottomSheet";
import {
  CategoryLists,
  CategoryType,
  getCategoryNameError,
} from "../../../../../helpers/categoryLists/categoryLists";
import { useTranslation } from "../../../../../i18n";

interface AddCategorySheetProps {
  type: CategoryType;
  categoryLists: CategoryLists;
  onCreate: (name: string) => Promise<unknown>;
  onClose: () => void;
}

/**
 * Creates a category of the active tab's type: one name field (focused when
 * the sheet opens) and Create category. A name already used by a category of
 * the same type is refused under the field and the sheet stays open.
 */
const AddCategorySheet = ({
  type,
  categoryLists,
  onCreate,
  onClose,
}: AddCategorySheetProps) => {
  const translator = useTranslation();
  const { t } = translator;
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nameError = getCategoryNameError(
      { name, type, categoryLists },
      translator
    );
    if (nameError) {
      setError(nameError);
      return;
    }
    try {
      await onCreate(name.trim());
      onClose();
    } catch (createError) {
      setError(t("addCategory.createFailed"));
    }
  };

  return (
    <BottomSheet
      className="category-sheet"
      title={
        type === "income"
          ? t("addSheet.titleIncome")
          : t("addSheet.titleExpense")
      }
      closeLabel={t("categories.sheetClose")}
      onClose={onClose}
      initialFocusRef={inputRef}
    >
      <Form className="category-sheet__content" onSubmit={handleSubmit} noValidate>
        <div>
          <Form.Label htmlFor="new-category-name">
            {t("categorySheet.name")}
          </Form.Label>
          <p className="field-hint" id="new-category-hint">
            {type === "income"
              ? t("addSheet.hintIncome")
              : t("addSheet.hintExpense")}
          </p>
          <Form.Control
            type="text"
            id="new-category-name"
            name="name"
            ref={inputRef}
            autoComplete="off"
            className={`text${error ? " category-sheet__input--error" : ""}`}
            aria-describedby="new-category-hint"
            aria-invalid={Boolean(error)}
            placeholder={t("addCategory.namePlaceholder")}
            value={name}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setName(event.currentTarget.value);
              setError(null);
            }}
          />
          {error && (
            <p className="validation-message category-sheet__error" role="alert">
              {error}
            </p>
          )}
        </div>
        <Button
          variant="primary"
          type="submit"
          className="category-sheet__last-action"
        >
          {t("addSheet.create")}
        </Button>
      </Form>
    </BottomSheet>
  );
};

export default AddCategorySheet;
