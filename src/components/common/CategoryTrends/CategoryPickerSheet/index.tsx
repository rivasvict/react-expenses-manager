import React from "react";
import { useTranslation } from "../../../../i18n";
import {
  CATEGORY_TYPES,
  CategoryLists,
  CategoryType,
} from "../../../../helpers/categoryLists/categoryLists";
import { formatSavings } from "../../../../helpers/savingsTrend/formatters";
import BottomSheet from "../../BottomSheet";
import TypeChip from "../../ExpensesManager/Categories/TypeChip";
// The raised sheet surface the category sheets share.
import "../../ExpensesManager/Categories/styles.scss";
import "./styles.scss";

export interface PickedCategory {
  type: CategoryType;
  name: string;
}

interface CategoryPickerSheetProps {
  categoryLists: CategoryLists;
  current: PickedCategory;
  /** What each category took in or cost in the end month. */
  amountOf: (category: PickedCategory) => number;
  onPick: (category: PickedCategory) => void;
  onClose: () => void;
}

const SECTION_LABELS = {
  expense: "categoryTrends.picker.expenses",
  income: "categoryTrends.picker.incomes",
} as const;

/**
 * "Choose a category": every expense category, then every income category,
 * each with the end month's amount and the current one marked. Picking one
 * applies it at once, then closes the sheet.
 */
const CategoryPickerSheet = ({
  categoryLists,
  current,
  amountOf,
  onPick,
  onClose,
}: CategoryPickerSheetProps) => {
  const { t } = useTranslation();
  return (
    <BottomSheet
      title={t("categoryTrends.picker.title")}
      closeLabel={t("savingsTrend.sheet.close")}
      onClose={onClose}
      className="category-sheet category-picker-sheet"
    >
      {CATEGORY_TYPES.filter((type) => categoryLists[type].length > 0).map((type) => (
        <div
          key={type}
          className="category-picker-sheet__group"
          role="radiogroup"
          aria-label={t(SECTION_LABELS[type])}
        >
          <span className="category-picker-sheet__label" aria-hidden="true">
            {t(SECTION_LABELS[type])}
          </span>
          {categoryLists[type].map((name) => {
            const isCurrent = type === current.type && name === current.name;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={isCurrent}
                className={`category-picker-sheet__option${isCurrent ? " category-picker-sheet__option--on" : ""}`}
                onClick={() => {
                  onPick({ type, name });
                  onClose();
                }}
              >
                <span className="category-picker-sheet__dot" aria-hidden="true" />
                <TypeChip type={type} />
                <span className="category-picker-sheet__name">{name}</span>
                <span className="category-picker-sheet__amount">
                  {formatSavings(amountOf({ type, name }))}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </BottomSheet>
  );
};

export default CategoryPickerSheet;
