import React, { useState } from "react";
import { Button } from "react-bootstrap";
import BottomSheet from "../../../BottomSheet";
import Callout from "../../../Callout";
import { Trans, useTranslation } from "../../../../../i18n";

interface DeleteUnusedSheetProps {
  name: string;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
}

const bold = { b: (text: string) => <b>{text}</b> };

/**
 * Deletes a category no entry uses, after a plain confirmation: the
 * "can't be undone" note, Delete category and Cancel.
 */
const DeleteUnusedSheet = ({ name, onConfirm, onClose }: DeleteUnusedSheetProps) => {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  const confirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (deleteError) {
      setFailed(true);
    }
  };

  return (
    <BottomSheet
      className="category-sheet"
      role="alertdialog"
      title={t("deleteSheet.title", { name })}
      closeLabel={t("categories.sheetClose")}
      onClose={onClose}
      footer={
        <>
          {failed && (
            <p className="validation-message category-sheet__error" role="alert">
              {t("deleteSheet.deleteFailed")}
            </p>
          )}
          <Button variant="danger" type="button" onClick={confirm}>
            {t("categorySheet.delete")}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </>
      }
    >
      <div className="category-sheet__content">
        <Callout tone="danger">
          <Trans i18nKey="deleteSheet.unusedWarning" components={bold} />
        </Callout>
      </div>
    </BottomSheet>
  );
};

export default DeleteUnusedSheet;
