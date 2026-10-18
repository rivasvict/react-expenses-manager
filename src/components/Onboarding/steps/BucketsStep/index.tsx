import React from "react";
import { useTranslation } from "../../../../i18n";
import {
  chosenNamesOf,
  isBucketTicked,
  setBucketLimit,
  toggleBucket,
  WizardDraft,
} from "../../../../onboarding/wizardDraft";
import CategoryIllustration from "../../../common/ExpensesManager/Categories/CategoryIllustration";
import BucketRow from "../../BucketRow";
import "./styles.scss";

interface BucketsStepProps {
  draft: WizardDraft;
  /** The error to show under each row; empty until Next is tapped. */
  errors: Record<string, string>;
  onDraftChange: (draft: WizardDraft) => void;
}

/**
 * Step 4: an optional monthly limit (a bucket) for each expense category the
 * user chose. With none chosen there is nothing to budget, and the step says
 * so; Next is always available.
 */
const BucketsStep = ({ draft, errors, onDraftChange }: BucketsStepProps) => {
  const { t } = useTranslation();
  const categories = chosenNamesOf(draft, "expense");

  if (categories.length === 0) {
    return (
      <div className="buckets-step__empty">
        <CategoryIllustration />
        <h2>{t("onboarding.bucketsEmptyTitle")}</h2>
        <p>{t("onboarding.bucketsEmptyText")}</p>
      </div>
    );
  }

  return (
    <>
      <p className="buckets-step__lead">{t("onboarding.bucketsLead")}</p>
      <div className="buckets-step__rows">
        {categories.map((category) => (
          <BucketRow
            key={category}
            name={category}
            ticked={isBucketTicked(draft, category)}
            limit={draft.buckets[category] ?? ""}
            error={errors[category]}
            limitLabel={t("onboarding.limitFor", { category })}
            limitPlaceholder={t("onboarding.limit")}
            onToggle={() => onDraftChange(toggleBucket(draft, category))}
            onLimitChange={(limit) =>
              onDraftChange(setBucketLimit(draft, category, limit))
            }
          />
        ))}
      </div>
    </>
  );
};

export default BucketsStep;
