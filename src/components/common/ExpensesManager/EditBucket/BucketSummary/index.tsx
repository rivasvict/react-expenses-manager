import React from "react";
import { Icon } from "@iconify/react";
import editIcon from "@iconify-icons/codicon/edit";
import { formatNumberForDisplay } from "../../../../../helpers/entriesHelper/entriesHelper";
import { useTranslation } from "../../../../../i18n";
import "./styles.scss";

// A true minus (U+2212): it reads as a sign next to an amount, not a hyphen.
const MINUS = "−";

interface BucketSummaryProps {
  monthLabel: string;
  percentage: number;
  spending: number;
  remainder: number;
  availability: number;
  allowance: number;
  carryOver: number;
  /** What an even pace allows by now; null when no pace applies. */
  expected: number | null;
  /** The day of the month `expected` is counted to, spelled for the language. */
  expectedDate: string;
  editButtonRef: React.RefObject<HTMLButtonElement>;
  onEdit: () => void;
}

/**
 * The edit-bucket screen's hero card (design/features/bucket-expenses/ui/
 * decision.md): usage, Left beside Spent, the bar with its pace tick, the pace
 * line and the monthly allowance row with its Edit button.
 */
const BucketSummary = ({
  monthLabel,
  percentage,
  spending,
  remainder,
  availability,
  allowance,
  carryOver,
  expected,
  expectedDate,
  editButtonRef,
  onEdit,
}: BucketSummaryProps) => {
  const { t } = useTranslation();
  const tone = percentage > 85 ? "danger" : percentage >= 65 ? "warning" : "";
  const isOver = remainder < 0;
  const difference = expected === null ? 0 : spending - expected;
  const tickPosition =
    expected === null ? 0 : Math.min(100, (expected / availability) * 100);

  return (
    <section className="bucket-summary" data-testid="bucket-summary">
      <div className="bucket-summary__top">
        <h2 className="bucket-summary__month">{monthLabel}</h2>
        <span className={`bucket-summary__usage ${tone}`}>
          {t("editBucket.used", { percent: Math.round(percentage) })}
        </span>
      </div>
      <div className="bucket-summary__figures">
        <div className={`bucket-summary__left${isOver ? " over" : ""}`}>
          <span className="bucket-summary__caption">
            {isOver ? t("bucket.over") : t("bucket.left")}
          </span>
          <strong data-testid="bucket-summary-left">
            {formatNumberForDisplay(Math.abs(remainder))}
          </strong>
        </div>
        <div className="bucket-summary__spent">
          <span className="bucket-summary__caption">{t("bucket.spent")}</span>
          <strong data-testid="bucket-summary-spent">
            {formatNumberForDisplay(spending)}
          </strong>
        </div>
      </div>
      <div className="bucket-summary__bar">
        <progress value={Math.min(percentage, 100)} max={100} className={tone} />
        {expected !== null && (
          <span
            className="bucket-summary__tick"
            style={{ left: `${tickPosition}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      {expected !== null && (
        <p className="bucket-summary__pace" data-testid="bucket-summary-pace">
          <span
            className={`bucket-summary__verdict ${difference <= 0 ? "under" : "ahead"}`}
          >
            {difference <= 0
              ? t("editBucket.underPace", {
                  amount: formatNumberForDisplay(-difference),
                })
              : t("editBucket.aheadOfPace", {
                  amount: formatNumberForDisplay(difference),
                })}
          </span>
          <span className="bucket-summary__expected">
            {t("editBucket.expectedBy", {
              date: expectedDate,
              amount: formatNumberForDisplay(expected),
            })}
          </span>
        </p>
      )}
      <div className="bucket-summary__allowance">
        <div>
          <span className="bucket-summary__caption">
            {t("bucketForm.monthlyAllowance")}
          </span>
          <strong data-testid="bucket-summary-allowance">
            {formatNumberForDisplay(allowance)}
          </strong>
          {carryOver !== 0 && (
            <span className="bucket-summary__carried">
              {t("editBucket.carriedFromEarlier", {
                amount: `${carryOver < 0 ? MINUS : "+"}${formatNumberForDisplay(Math.abs(carryOver))}`,
              })}
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-secondary bucket-summary__edit"
          aria-label={t("editBucket.editLabel")}
          ref={editButtonRef}
          onClick={onEdit}
        >
          <Icon icon={editIcon} aria-hidden="true" />
          {t("editBucket.edit")}
        </button>
      </div>
    </section>
  );
};

export default BucketSummary;
