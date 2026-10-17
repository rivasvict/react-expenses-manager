import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { Icon } from "@iconify/react";
import tagIcon from "@iconify-icons/codicon/tag";
import trashIcon from "@iconify-icons/codicon/trash";
import TypeChip from "../../common/ExpensesManager/Categories/TypeChip";
import {
  AffectedEntry,
  CategoryChange,
} from "../../../helpers/categoryChanges/categoryChanges";
import { formatCurrency } from "../../../helpers/currency/currency";
import {
  formatDayMonth,
  formatShortDate,
} from "../../../helpers/shortDate/shortDate";
import { useTranslation } from "../../../i18n";
import "./styles.scss";

interface CategoryNoteCardProps {
  change: CategoryChange;
  /** This device's entries the change moves. */
  affected: AffectedEntry[];
  onContinue: () => void;
}

const SHOWN_AT_FIRST = 3;

/**
 * A category rename or deletion made by another party member, in the review
 * wizard (design/features/category-management/ui/approved/sync-note.*): what
 * changed, who changed it and when, and the user's own entries it moves. It
 * is for information only, so its one action is Continue.
 */
const CategoryNoteCard = ({ change, affected, onContinue }: CategoryNoteCardProps) => {
  const { t, language } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const isRename = change.kind === "rename";
  const isIncome = change.type === "income";
  const date = formatDayMonth(change.at, language);
  const typeLabel = isIncome
    ? t("categorySheet.incomeType")
    : t("categorySheet.expenseType");
  const byLine = change.by?.name
    ? t(isRename ? "syncReview.renamedBy" : "syncReview.deletedBy", {
        type: typeLabel,
        name: change.by.name,
        date,
      })
    : t(isRename ? "syncReview.renamedOn" : "syncReview.deletedOn", {
        type: typeLabel,
        date,
      });
  const listLabel = isRename
    ? t(isIncome ? "syncReview.yourEntriesChangeIncome" : "syncReview.yourEntriesChange")
    : t(isIncome ? "syncReview.yourEntriesMoveIncome" : "syncReview.yourEntriesMove");
  // Newest first, fixed (undated) entries last, as in the delete sheet.
  const ordered = [...affected].sort(
    (first, second) => (second.date ?? -Infinity) - (first.date ?? -Infinity)
  );
  const shown = showAll ? ordered : ordered.slice(0, SHOWN_AT_FIRST);

  return (
    <section className="category-note">
      <p className={`category-note__kind category-note__kind--${change.kind}`}>
        <Icon icon={isRename ? tagIcon : trashIcon} aria-hidden="true" />
        {isRename ? t("syncReview.categoryRenamed") : t("syncReview.categoryDeleted")}
      </p>
      <p className="category-note__names">
        <span className="category-note__old">{change.name}</span>
        {isRename && (
          <>
            <span aria-hidden="true">→</span>
            <span>{change.newName}</span>
          </>
        )}
      </p>
      <p className="category-note__by">{byLine}</p>
      {affected.length > 0 && (
        <>
          <h3 className="category-note__section">
            <span>{listLabel}</span>
            <span>{affected.length}</span>
          </h3>
          <ul className="category-note__list">
            {shown.map((entry) => {
              const amount = formatCurrency(Number(entry.amount) || 0);
              const when =
                entry.date !== undefined
                  ? formatShortDate(entry.date, language)
                  : "";
              return (
                <li className="category-note__entry" key={entry.id}>
                  <TypeChip type={entry.type} />
                  <span className="category-note__main">
                    <span className="category-note__description">
                      {entry.description || amount}
                    </span>
                    <span className="category-note__date">
                      {isRename ? when : [when, amount].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span
                    className={`category-note__end${isRename ? ` category-note__end--${entry.type}` : ""}`}
                  >
                    {isRename ? amount : `→ ${entry.target || change.name}`}
                  </span>
                </li>
              );
            })}
          </ul>
          {!showAll && affected.length > SHOWN_AT_FIRST && (
            <button
              type="button"
              className="category-note__more"
              onClick={() => setShowAll(true)}
            >
              {t("syncReview.showMore", {
                count: affected.length - SHOWN_AT_FIRST,
              })}
            </button>
          )}
        </>
      )}
      <Button variant="primary" className="category-note__continue" onClick={onContinue}>
        {t("syncReview.continue")}
      </Button>
      <p className="category-note__fine-print">{t("syncReview.cantReject")}</p>
    </section>
  );
};

export default CategoryNoteCard;
