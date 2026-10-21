import React, { forwardRef } from "react";
import { Icon } from "@iconify/react";
import chevronDown from "@iconify-icons/codicon/chevron-down";
import { useTranslation } from "../../../../i18n";
import type { CategoryType } from "../../../../helpers/categoryLists/categoryLists";
import TypeChip from "../../ExpensesManager/Categories/TypeChip";
import "./styles.scss";

interface CategoryPickerProps {
  type: CategoryType;
  name: string;
  onOpen: () => void;
}

/**
 * The row naming the category a trend is about ("Expense category · Eating
 * out"). It is a button that opens the "Choose a category" sheet.
 */
const CategoryPicker = forwardRef<HTMLButtonElement, CategoryPickerProps>(
  ({ type, name, onOpen }, ref) => {
    const { t } = useTranslation();
    const kind = t(`categoryTrends.kind.${type}`);
    return (
      <button
        ref={ref}
        type="button"
        className="category-picker"
        aria-haspopup="dialog"
        aria-label={t("categoryTrends.picker.rowLabel", { kind, name })}
        onClick={onOpen}
      >
        <TypeChip type={type} />
        <span className="category-picker__main">
          <span className="category-picker__kind">{kind}</span>
          <span className="category-picker__name">{name}</span>
        </span>
        <Icon icon={chevronDown} className="category-picker__chevron" aria-hidden="true" />
      </button>
    );
  }
);

export default CategoryPicker;
