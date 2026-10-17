import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import BottomSheet from "../../../BottomSheet";
import Callout from "../../../Callout";
import UsageFigures from "../UsageFigures";
import {
  CategoryLists,
  CategoryType,
  getCategoryNameError,
} from "../../../../../helpers/categoryLists/categoryLists";
import { CategoryUsage } from "../../../../../helpers/categoryUsage/categoryUsage";
import { formatCurrency } from "../../../../../helpers/currency/currency";
import { Trans, useTranslation } from "../../../../../i18n";

interface CategorySheetProps {
  type: CategoryType;
  name: string;
  usage: CategoryUsage;
  /** The bucket's current monthly limit; undefined when it has none. */
  bucketLimit?: number;
  categoryLists: CategoryLists;
  onSave: (newName: string) => Promise<unknown>;
  onDelete: () => void;
  onClose: () => void;
}

const bold = { b: (text: string) => <b>{text}</b> };

/**
 * What a category holds and what can be done with it: its usage figures, the
 * name field (with an amber note naming the entries a rename changes) and
 * Save changes, then a danger zone with Delete category.
 */
const CategorySheet = ({
  type,
  name,
  usage,
  bucketLimit,
  categoryLists,
  onSave,
  onDelete,
  onClose,
}: CategorySheetProps) => {
  const translator = useTranslation();
  const { t, plural, pluralKey } = translator;
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const isIncome = type === "income";
  const hasBucket = bucketLimit !== undefined;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nameError = getCategoryNameError(
      { name: draft, type, categoryLists, currentName: name },
      translator
    );
    if (nameError) {
      setError(nameError);
      return;
    }
    if (draft.trim() === name) {
      onClose();
      return;
    }
    try {
      await onSave(draft.trim());
      onClose();
    } catch (saveError) {
      setError(t("categorySheet.saveFailed"));
    }
  };

  const impactKey = isIncome
    ? pluralKey("categorySheet.renameImpactIncome", usage.count)
    : hasBucket
      ? pluralKey("categorySheet.renameImpactBucket", usage.count)
      : pluralKey("categorySheet.renameImpact", usage.count);

  return (
    <BottomSheet
      className="category-sheet"
      variant="tall"
      eyebrow={
        isIncome ? t("categorySheet.incomeType") : t("categorySheet.expenseType")
      }
      title={name}
      closeLabel={t("categories.sheetClose")}
      onClose={onClose}
    >
      <Form className="category-sheet__content" onSubmit={handleSubmit} noValidate>
        <UsageFigures
          figures={[
            {
              value: String(usage.count),
              label: isIncome
                ? t("categorySheet.statIncomes")
                : t("categorySheet.statExpenses"),
            },
            {
              value: formatCurrency(usage.total),
              label: t("categorySheet.statTotal"),
            },
            hasBucket
              ? {
                  value: formatCurrency(bucketLimit as number),
                  label: t("categorySheet.statBucket"),
                }
              : { value: "—", label: t("categorySheet.noBucket") },
          ]}
        />
        <div>
          <Form.Label htmlFor="category-name">
            {t("categorySheet.name")}
          </Form.Label>
          <Form.Control
            type="text"
            id="category-name"
            name="name"
            autoComplete="off"
            className={`text${error ? " category-sheet__input--error" : ""}`}
            aria-invalid={Boolean(error)}
            value={draft}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setDraft(event.currentTarget.value);
              setError(null);
            }}
          />
          {error && (
            <p className="validation-message category-sheet__error" role="alert">
              {error}
            </p>
          )}
        </div>
        {usage.count > 0 && (
          <Callout tone="warn">
            <Trans
              i18nKey={impactKey}
              params={{
                count: usage.count,
                name,
                ...(hasBucket
                  ? { amount: formatCurrency(bucketLimit as number) }
                  : {}),
              }}
              components={bold}
            />
          </Callout>
        )}
        <Button variant="primary" type="submit">
          {t("categorySheet.save")}
        </Button>
        <h3 className="category-sheet__group-label category-sheet__group-label--danger-zone">
          {t("categorySheet.dangerZone")}
        </h3>
        <p className="category-sheet__note">
          {usage.count > 0
            ? plural(
                isIncome
                  ? "categorySheet.deleteHintIncome"
                  : "categorySheet.deleteHint",
                usage.count
              )
            : t("categorySheet.unusedHint")}
        </p>
        <Button
          variant="danger"
          type="button"
          className="category-sheet__last-action"
          onClick={onDelete}
        >
          {t("categorySheet.delete")}
        </Button>
      </Form>
    </BottomSheet>
  );
};

export default CategorySheet;
