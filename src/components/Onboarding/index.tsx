import React, { useState } from "react";
import { connect } from "react-redux";
import { useTranslation } from "../../i18n";
import { formatCurrency, storeCurrency, getStoredCurrency } from "../../helpers/currency/currency";
import { usePrivacy } from "../../privacy";
import { applyOnboarding } from "../../redux/expensesManager/actionCreators";
import { markOnboardingCompleted } from "../../onboarding/onboardingStatus";
import {
  chosenNamesOf,
  createWizardDraft,
  getBucketCount,
  getEmptyOnboardingResult,
  getBucketErrors,
  getBucketsTotal,
  OnboardingResult,
  toOnboardingResult,
  WizardDraft,
} from "../../onboarding/wizardDraft";
import WizardShell from "./WizardShell";
import PreferencesStep from "./steps/PreferencesStep";
import CategoriesStep from "./steps/CategoriesStep";
import BucketsStep from "./steps/BucketsStep";
import ReviewStep, { ReviewSection } from "./steps/ReviewStep";

const STEP_COUNT = 5;
const PREFERENCES = 1;
const EXPENSES = 2;
const INCOMES = 3;
const BUCKETS = 4;
const REVIEW = 5;

const STEP_OF_SECTION: Record<ReviewSection, number> = {
  preferences: PREFERENCES,
  expense: EXPENSES,
  income: INCOMES,
  buckets: BUCKETS,
};

interface OnboardingProps {
  onApplyOnboarding: (result: OnboardingResult) => Promise<unknown>;
  /** Called once the wizard is over, finished or skipped. */
  onDone: () => void;
}

/**
 * The first-run wizard for a new user (design/features/new-user-onboarding):
 * Preferences, Expenses, Incomes, Buckets and Review, with the choices held in
 * a draft until Start tracking saves them. Skip setup leaves at once with no
 * categories and no buckets, keeping only the language, which already applied
 * when it was picked.
 */
const Onboarding = ({ onApplyOnboarding, onDone }: OnboardingProps) => {
  const translator = useTranslation();
  const { t, plural } = translator;
  const { enabled: privacyEnabled, setEnabled: setPrivacyEnabled } = usePrivacy();
  const [draft, setDraft] = useState<WizardDraft>(() =>
    createWizardDraft({
      currency: getStoredCurrency(),
      privacyMode: privacyEnabled,
    })
  );
  const [step, setStep] = useState(PREFERENCES);
  const [editing, setEditing] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const bucketErrors = showErrors ? getBucketErrors(draft, translator) : {};

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onApplyOnboarding(toOnboardingResult(draft));
      storeCurrency(draft.currency);
      setPrivacyEnabled(draft.privacyMode);
      markOnboardingCompleted();
      onDone();
    } finally {
      setSaving(false);
    }
  };

  // Skipping leaves the user with no categories and no buckets (not the seed
  // lists), so the empty lists are saved like a finished wizard's.
  const skip = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onApplyOnboarding(getEmptyOnboardingResult());
      markOnboardingCompleted();
      onDone();
    } finally {
      setSaving(false);
    }
  };

  const goTo = (nextStep: number) => {
    setShowErrors(false);
    setStep(nextStep);
  };

  const next = () => {
    if (step === REVIEW) {
      finish();
      return;
    }
    if (step === BUCKETS && Object.keys(getBucketErrors(draft, translator)).length) {
      setShowErrors(true);
      return;
    }
    // After an Edit from the review, Next goes straight back to it.
    goTo(editing ? REVIEW : step + 1);
    if (editing) setEditing(false);
  };

  const back = () => goTo(step - 1);

  const edit = (section: ReviewSection) => {
    setEditing(true);
    goTo(STEP_OF_SECTION[section]);
  };

  const selectedSummary = (type: "expense" | "income") => {
    const count = chosenNamesOf(draft, type).length;
    return count
      ? t("onboarding.selected", { count })
      : t("onboarding.selectedNone");
  };

  const bucketCount = getBucketCount(draft);
  const summaries: Record<number, string | undefined> = {
    [EXPENSES]: selectedSummary("expense"),
    [INCOMES]: selectedSummary("income"),
    [BUCKETS]: bucketCount
      ? plural("onboarding.bucketsSummary", bucketCount, {
          amount: formatCurrency(getBucketsTotal(draft), draft.currency),
        })
      : undefined,
  };
  const titles: Record<number, React.ReactNode> = {
    [PREFERENCES]: t("onboarding.welcome"),
    [EXPENSES]: t("onboarding.expensesTitle"),
    [INCOMES]: t("onboarding.incomesTitle"),
    [BUCKETS]: (
      <>
        {t("onboarding.bucketsTitle")}{" "}
        <span className="wizard-shell__optional">{t("onboarding.optional")}</span>
      </>
    ),
    [REVIEW]: t("onboarding.reviewTitle"),
  };

  return (
    <WizardShell
      step={step}
      total={STEP_COUNT}
      title={titles[step]}
      summary={summaries[step]}
      nextLabel={t(step === REVIEW ? "onboarding.start" : "onboarding.next")}
      onNext={next}
      onBack={step === PREFERENCES ? undefined : back}
      onSkip={skip}
    >
      {step === PREFERENCES && (
        <PreferencesStep
          currency={draft.currency}
          privacyMode={draft.privacyMode}
          onCurrencyChange={(currency) => setDraft({ ...draft, currency })}
          onPrivacyModeChange={(privacyMode) => setDraft({ ...draft, privacyMode })}
        />
      )}
      {step === EXPENSES && (
        <CategoriesStep type="expense" draft={draft} onDraftChange={setDraft} />
      )}
      {step === INCOMES && (
        <CategoriesStep type="income" draft={draft} onDraftChange={setDraft} />
      )}
      {step === BUCKETS && (
        <BucketsStep draft={draft} errors={bucketErrors} onDraftChange={setDraft} />
      )}
      {step === REVIEW && <ReviewStep draft={draft} onEdit={edit} />}
    </WizardShell>
  );
};

const mapActionToProps = (dispatch: any) => ({
  onApplyOnboarding: (result: OnboardingResult) =>
    dispatch(applyOnboarding(result)),
});

export default connect(null, mapActionToProps)(Onboarding);
