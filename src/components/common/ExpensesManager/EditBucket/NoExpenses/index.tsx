import React from "react";
import { Link } from "react-router-dom";
import TypeChip from "../../Categories/TypeChip";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

interface NoExpensesProps {
  bucketName: string;
  monthLabel: string;
}

/** What the screen shows instead of the weeks when nothing was spent. */
const NoExpenses = ({ bucketName, monthLabel }: NoExpensesProps) => {
  const { t } = useTranslation();

  return (
    <section className="no-expenses" data-testid="no-expenses">
      <TypeChip type="expense" />
      <h2 className="no-expenses__title">
        {t("editBucket.emptyTitle", { name: bucketName })}
      </h2>
      <p className="no-expenses__message">
        {t("editBucket.emptyMessage", { name: bucketName, month: monthLabel })}
      </p>
      <Link to="/add-expense" className="btn btn-secondary">
        {t("editBucket.addExpense")}
      </Link>
    </section>
  );
};

export default NoExpenses;
