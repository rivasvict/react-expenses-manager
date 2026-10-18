import React from "react";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

interface SummaryRowProps {
  title: string;
  hint: string;
  onEdit: () => void;
}

/** One line of the wizard's review: what will be created, and an Edit link. */
const SummaryRow = ({ title, hint, onEdit }: SummaryRowProps) => {
  const { t } = useTranslation();

  return (
    <div className="summary-row">
      <div className="summary-row__text">
        <span className="summary-row__title">{title}</span>
        <small className="summary-row__hint">{hint}</small>
      </div>
      <button
        type="button"
        className="summary-row__edit"
        aria-label={t("onboarding.editSection", { section: title })}
        onClick={onEdit}
      >
        {t("onboarding.edit")}
      </button>
    </div>
  );
};

export default SummaryRow;
