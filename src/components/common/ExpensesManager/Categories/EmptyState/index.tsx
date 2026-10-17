import React from "react";
import CategoryIllustration from "../CategoryIllustration";
import { CategoryType } from "../../../../../helpers/categoryLists/categoryLists";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

/**
 * Shown in place of the list when a type has no categories: the
 * illustration, a title and a short explanation. The screen's own primary
 * button ("Add income category") is the call to action.
 */
const EmptyState = ({ type }: { type: CategoryType }) => {
  const { t } = useTranslation();
  return (
    <div className="categories-empty">
      <CategoryIllustration />
      <h2 className="categories-empty__title">
        {type === "income"
          ? t("categories.emptyIncomeTitle")
          : t("categories.emptyExpenseTitle")}
      </h2>
      <p className="categories-empty__text">
        {type === "income"
          ? t("categories.emptyIncomeText")
          : t("categories.emptyExpenseText")}
      </p>
    </div>
  );
};

export default EmptyState;
