import React from "react";
import { useTranslation } from "../../../../i18n";
import { LANGUAGE_NATIVE_NAMES } from "../../../../i18n/languages";
import {
  CURRENCY_SYMBOLS,
  formatCurrency,
} from "../../../../helpers/currency/currency";
import { CategoryType } from "../../../../helpers/categoryLists/categoryLists";
import {
  chosenNamesOf,
  getBucketCount,
  getBucketsTotal,
  WizardDraft,
} from "../../../../onboarding/wizardDraft";
import SummaryRow from "../../SummaryRow";
import "./styles.scss";

export type ReviewSection = "preferences" | "expense" | "income" | "buckets";

interface ReviewStepProps {
  draft: WizardDraft;
  onEdit: (section: ReviewSection) => void;
}

/**
 * Step 5: what Start tracking will create, one row per section with an Edit
 * link back to its step. An empty choice reads as such, with where to add it
 * later; nothing here is saved until the user finishes.
 */
const ReviewStep = ({ draft, onEdit }: ReviewStepProps) => {
  const { t, plural, language } = useTranslation();

  const categoryRow = (type: CategoryType) => {
    const names = draft.categories[type].own;
    const count = chosenNamesOf(draft, type).length;
    return (
      <SummaryRow
        title={
          count
            ? plural(type === "expense" ? "onboarding.reviewExpenses" : "onboarding.reviewIncomes", count)
            : t(type === "expense" ? "onboarding.reviewNoExpenses" : "onboarding.reviewNoIncomes")
        }
        hint={
          names.length
            ? t("onboarding.reviewOwn", { names: names.join(", ") })
            : t("onboarding.reviewNoCategoriesHint")
        }
        onEdit={() => onEdit(type)}
      />
    );
  };
  const bucketCount = getBucketCount(draft);

  return (
    <>
      <p className="review-step__lead">{t("onboarding.reviewLead")}</p>
      <div className="review-step__rows">
        <SummaryRow
          title={`${LANGUAGE_NATIVE_NAMES[language]} · ${CURRENCY_SYMBOLS[draft.currency]} ${draft.currency}`}
          hint={t(draft.privacyMode ? "onboarding.privacyOn" : "onboarding.privacyOff")}
          onEdit={() => onEdit("preferences")}
        />
        {categoryRow("expense")}
        {categoryRow("income")}
        <SummaryRow
          title={
            bucketCount
              ? plural("onboarding.reviewBuckets", bucketCount)
              : t("onboarding.reviewNoBuckets")
          }
          hint={
            bucketCount
              ? t("onboarding.reviewBucketsTotal", {
                  amount: formatCurrency(getBucketsTotal(draft), draft.currency),
                })
              : t("onboarding.reviewNoBucketsHint")
          }
          onEdit={() => onEdit("buckets")}
        />
      </div>
    </>
  );
};

export default ReviewStep;
