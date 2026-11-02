// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import "./styles.scss";
import { formatNumberForDisplay } from "../../../../../../helpers/entriesHelper/entriesHelper";
import RowLink from "../../../../RowLink";
import { useTranslation } from "../../../../../../i18n";

// A true minus (U+2212): it reads as a sign next to an amount, not a hyphen.
const MINUS = "\u2212";

/**
 * One bucket card (design/features/bucket-card-text/ui/decision.md): name and
 * usage, the bar, Spent beside a larger Left (Over once past the limit), and a
 * footnote with the allowance and, when there is any, what was carried over.
 */
const Bucket = ({
  category,
  allowance,
  carryOver,
  spending,
  remainder,
  consuptionPercentage,
}) => {
  const { t } = useTranslation();
  const colorClass =
    consuptionPercentage > 85
      ? "danger"
      : consuptionPercentage >= 65
        ? "warning"
        : "";

  const testId = `bucket-${category.toLowerCase().replace(/\s/g, "-")}`;
  const isOver = remainder < 0;

  return (
    <RowLink
      to={`edit-bucket/${category.toLowerCase().replace(/\s/g, "-")}`}
      title={t("bucket.edit", { category })}
      aria-label={t("bucket.edit", { category })}
      className="bucket-container"
      data-testid={testId}
    >
      <div className="bucket-body">
        <div className="bucket-legend">
          <div className="bucket-name">{category}</div>
          <div
            className={`usage-percentage ${colorClass}`}
            data-testid={`${testId}-percentage`}
          >{`${Math.round(consuptionPercentage)}%`}</div>
        </div>
        <progress
          value={consuptionPercentage}
          max={100}
          className={colorClass}
        />
        <div className="bucket-figures">
          <div className="bucket-figure">
            <span className="bucket-figure__label">{t("bucket.spent")}</span>
            <strong
              className="bucket-figure__value"
              data-testid={`${testId}-spending`}
            >
              {formatNumberForDisplay(spending)}
            </strong>
          </div>
          <div
            className={`bucket-figure bucket-figure--left${isOver ? " over" : ""}`}
          >
            <span
              className="bucket-figure__label"
              data-testid={`${testId}-remaining-label`}
            >
              {isOver ? t("bucket.over") : t("bucket.left")}
            </span>
            <strong
              className="bucket-figure__value"
              data-testid={`${testId}-remaining`}
            >
              {formatNumberForDisplay(Math.abs(remainder))}
            </strong>
          </div>
        </div>
        <p className="bucket-carry-on" data-testid={`${testId}-carry-over`}>
          <span className="bucket-carry-on__part">
            {t("bucket.allowance")} {formatNumberForDisplay(allowance)}
          </span>
          {carryOver !== 0 && (
            <span className="bucket-carry-on__part">
              {" "}
              {t("bucket.carried")}{" "}
              <span
                className={carryOver < 0 ? "carried-debt" : "carried-surplus"}
              >
                {carryOver < 0 ? MINUS : "+"}
                {formatNumberForDisplay(Math.abs(carryOver))}
              </span>
            </span>
          )}
        </p>
      </div>
    </RowLink>
  );
};

export default Bucket;
