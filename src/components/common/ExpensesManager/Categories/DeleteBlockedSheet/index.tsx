import React from "react";
import { Button } from "react-bootstrap";
import BottomSheet from "../../../BottomSheet";
import CategoryIllustration from "../CategoryIllustration";
import { CategoryType } from "../../../../../helpers/categoryLists/categoryLists";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

interface DeleteBlockedSheetProps {
  type: CategoryType;
  name: string;
  /** How many entries use it. */
  count: number;
  onAddCategory: () => void;
  onClose: () => void;
}

/**
 * Shown instead of the delete sheet when entries use the category and it is
 * the only one of its type, so they have nowhere to go: it explains why and
 * offers to add another category of that type first.
 */
const DeleteBlockedSheet = ({
  type,
  name,
  count,
  onAddCategory,
  onClose,
}: DeleteBlockedSheetProps) => {
  const { t, plural } = useTranslation();
  const isIncome = type === "income";
  return (
    <BottomSheet
      className="category-sheet"
      role="alertdialog"
      title={t("deleteSheet.blockedTitle", { name })}
      closeLabel={t("categories.sheetClose")}
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" type="button" onClick={onAddCategory}>
            {isIncome ? t("categories.addIncome") : t("categories.addExpense")}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </>
      }
    >
      <div className="delete-blocked">
        <CategoryIllustration />
        <p className="delete-blocked__text">
          {plural(
            isIncome ? "deleteSheet.blockedIncome" : "deleteSheet.blockedExpense",
            count,
            { name }
          )}
        </p>
      </div>
    </BottomSheet>
  );
};

export default DeleteBlockedSheet;
