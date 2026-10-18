// What the first-run wizard collects before anything is saved
// (design/features/new-user-onboarding/ui/decision.md). Pure functions over a
// plain draft object so the whole flow can be tested without a screen.
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getBucketAllowanceValidationError,
} from "../helpers/entriesHelper/entriesHelper";
import {
  CategoryLists,
  CategoryType,
  getCategoryNameError,
} from "../helpers/categoryLists/categoryLists";
import { Currency } from "../helpers/currency/currency";
import { defaultTranslator, Translator } from "../i18n/translator";

export interface CategoryChoice {
  /** Seed names the user kept, in no particular order. */
  seeds: string[];
  /** Names the user typed, in the order they were added; always chosen. */
  own: string[];
}

export interface WizardDraft {
  currency: Currency;
  privacyMode: boolean;
  categories: Record<CategoryType, CategoryChoice>;
  /** A ticked category's limit as typed; a missing key is an unticked row. */
  buckets: Record<string, string>;
}

/** What Start tracking saves. */
export interface OnboardingResult {
  categoryLists: CategoryLists;
  /** Monthly limit by expense category name; only limits above zero. */
  buckets: Record<string, number>;
}

export const SEED_CATEGORIES: Record<CategoryType, string[]> = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
};

export const createWizardDraft = ({
  currency,
  privacyMode,
}: Pick<WizardDraft, "currency" | "privacyMode">): WizardDraft => ({
  currency,
  privacyMode,
  categories: {
    expense: { seeds: [], own: [] },
    income: { seeds: [], own: [] },
  },
  buckets: {},
});

/** Every chip the step shows: the seed list, then the user's own names. */
export const chipNamesOf = (draft: WizardDraft, type: CategoryType) => [
  ...SEED_CATEGORIES[type],
  ...draft.categories[type].own,
];

/** The categories the user chose, seeds in seed order and then own names. */
export const chosenNamesOf = (draft: WizardDraft, type: CategoryType) => {
  const { seeds, own } = draft.categories[type];
  return [...SEED_CATEGORIES[type].filter((name) => seeds.includes(name)), ...own];
};

const withChoice = (
  draft: WizardDraft,
  type: CategoryType,
  choice: CategoryChoice
): WizardDraft => ({
  ...draft,
  categories: { ...draft.categories, [type]: choice },
});

// A bucket only makes sense for a chosen expense category, so changing the
// choice drops the limits of categories that are no longer chosen.
const pruneBuckets = (draft: WizardDraft): WizardDraft => {
  const chosen = chosenNamesOf(draft, "expense");
  const buckets = Object.fromEntries(
    Object.entries(draft.buckets).filter(([name]) => chosen.includes(name))
  );
  return { ...draft, buckets };
};

const replaceChoice = (
  draft: WizardDraft,
  type: CategoryType,
  choice: CategoryChoice
) => pruneBuckets(withChoice(draft, type, choice));

export const toggleCategory = (
  draft: WizardDraft,
  type: CategoryType,
  name: string
): WizardDraft => {
  const { seeds, own } = draft.categories[type];
  if (own.includes(name)) {
    return replaceChoice(draft, type, {
      seeds,
      own: own.filter((ownName) => ownName !== name),
    });
  }
  return replaceChoice(draft, type, {
    seeds: seeds.includes(name)
      ? seeds.filter((seed) => seed !== name)
      : [...seeds, name],
    own,
  });
};

export const selectAllCategories = (
  draft: WizardDraft,
  type: CategoryType
): WizardDraft =>
  replaceChoice(draft, type, {
    seeds: [...SEED_CATEGORIES[type]],
    own: draft.categories[type].own,
  });

/** Deselects everything, including the user's own names (their chips go). */
export const clearCategories = (
  draft: WizardDraft,
  type: CategoryType
): WizardDraft => replaceChoice(draft, type, { seeds: [], own: [] });

export const isSelected = (
  draft: WizardDraft,
  type: CategoryType,
  name: string
) =>
  draft.categories[type].own.includes(name) ||
  draft.categories[type].seeds.includes(name);

/**
 * Adds a name of the user's own as a chosen chip, or returns the error to show
 * (empty, or already a chip of this type, seed names included, ignoring case).
 */
export const addOwnCategory = (
  draft: WizardDraft,
  type: CategoryType,
  name: string,
  translator: Translator = defaultTranslator
): { draft: WizardDraft; error: string | null } => {
  const categoryLists: CategoryLists = {
    expense: chipNamesOf(draft, "expense"),
    income: chipNamesOf(draft, "income"),
  };
  const error = getCategoryNameError({ name, type, categoryLists }, translator);
  if (error) return { draft, error };
  const { seeds, own } = draft.categories[type];
  return {
    draft: replaceChoice(draft, type, { seeds, own: [...own, name.trim()] }),
    error: null,
  };
};

export const isBucketTicked = (draft: WizardDraft, name: string) =>
  name in draft.buckets;

/** Ticks a row (with no limit yet) or unticks it. */
export const toggleBucket = (draft: WizardDraft, name: string): WizardDraft => {
  const { [name]: removed, ...rest } = draft.buckets;
  return {
    ...draft,
    buckets: isBucketTicked(draft, name) ? rest : { ...rest, [name]: "" },
  };
};

/** Typing a limit ticks the row; clearing the field unticks it. */
export const setBucketLimit = (
  draft: WizardDraft,
  name: string,
  limit: string
): WizardDraft => {
  const { [name]: removed, ...rest } = draft.buckets;
  return {
    ...draft,
    buckets: limit.trim() === "" ? rest : { ...rest, [name]: limit },
  };
};

/** The error to show under each ticked row whose limit is not above zero. */
export const getBucketErrors = (
  draft: WizardDraft,
  translator: Translator = defaultTranslator
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(draft.buckets).flatMap(([name, limit]) => {
      const error = getBucketAllowanceValidationError(limit, translator);
      return error ? [[name, error]] : [];
    })
  );

/** The sum of the limits typed so far, ignoring any that are not valid. */
export const getBucketsTotal = (draft: WizardDraft): number =>
  Object.entries(draft.buckets).reduce(
    (total, [, limit]) =>
      getBucketAllowanceValidationError(limit) ? total : total + Number(limit),
    0
  );

/** How many buckets Start tracking would create: ticked rows with a valid limit. */
export const getBucketCount = (draft: WizardDraft): number =>
  Object.values(draft.buckets).filter(
    (limit) => !getBucketAllowanceValidationError(limit)
  ).length;

export const toOnboardingResult = (draft: WizardDraft): OnboardingResult => ({
  categoryLists: {
    expense: chosenNamesOf(draft, "expense"),
    income: chosenNamesOf(draft, "income"),
  },
  buckets: Object.fromEntries(
    Object.entries(draft.buckets)
      .filter(([, limit]) => !getBucketAllowanceValidationError(limit))
      .map(([name, limit]) => [name, Number(limit)])
  ),
});
