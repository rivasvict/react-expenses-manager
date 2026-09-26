// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
// Pure display mapping from a diffed SyncItem to the review card's facts
// (DESIGN 4.3.1): kind badge, money fields, attribution and the
// item-specific accessible action labels.
import dayjs from "dayjs";
import { SyncItem } from "../../helpers/syncMergeHelper/syncMergeHelper";
import { CURRENCY_SYMBOL } from "../../constants";
import { AddedBy } from "../../services/session";
import { defaultTranslator, Translator } from "../../i18n/translator";

export interface ItemFacts {
  kindLabel: string;
  // "income" | "expense" tones the amount like every other money row.
  tone?: "income" | "expense";
  amountText?: string;
  description?: string;
  categories?: string;
  dateText?: string;
  removed?: boolean;
  attribution: string; // "Added by Tom" / "Added anonymously"
  shortLabel: string; // for aria-labels: "Accept {shortLabel}"
}

// ",eating out," → "eating out"; ",Household,eating out," → "Household,
// eating out".
const prettyCategories = (path?: string): string | undefined => {
  if (!path) return undefined;
  const segments = path.split(",").filter((segment) => segment.trim() !== "");
  return segments.length ? segments.join(", ") : undefined;
};

const money = (value: any): string => {
  const parsed = Number(value);
  return `${CURRENCY_SYMBOL}${Number.isFinite(parsed) ? parsed.toFixed(2) : value}`;
};

const attributionText = (
  addedBy: AddedBy | undefined,
  { t }: Translator
): string =>
  // AC-1.6/AC-3.4 — legacy/unattributed items show the anonymous fallback.
  addedBy && addedBy.name
    ? t("syncReview.addedBy", { name: addedBy.name })
    : t("syncReview.addedAnonymously");

// Labels are in the translator's language (English when none is given).
export const getItemFacts = (
  item: SyncItem,
  translator: Translator = defaultTranslator
): ItemFacts => {
  const { t, language } = translator;
  if (item.kind === "entry") {
    const entry = item.entry;
    const kindLabel =
      entry.type === "income"
        ? t("syncReview.kind.income")
        : t("syncReview.kind.expense");
    const attribution = attributionText(entry.addedBy, translator);
    return {
      kindLabel,
      tone: entry.type,
      amountText: money(entry.amount),
      description: entry.description,
      categories: prettyCategories(entry.categories_path),
      dateText: dayjs(entry.date).locale(language).format(t("time.dateFormat")),
      attribution,
      shortLabel: t("syncReview.shortLabel", {
        amount: money(entry.amount),
        kind: kindLabel.toLowerCase(),
        attribution: attribution.toLowerCase(),
      }),
    };
  }

  if (item.kind === "fixed" && item.fixed) {
    const state = item.fixed.state;
    const kindLabel =
      item.fixed.type === "income"
        ? t("syncReview.kind.fixedIncome")
        : t("syncReview.kind.fixedExpense");
    const attribution = attributionText(state.addedBy, translator);
    if (state.removed) {
      return {
        kindLabel,
        removed: true,
        dateText: t("syncReview.removedFrom", { month: state.from }),
        attribution,
        shortLabel: t("syncReview.removalShortLabel", {
          kind: kindLabel.toLowerCase(),
          attribution: attribution.toLowerCase(),
        }),
      };
    }
    return {
      kindLabel,
      tone: item.fixed.type === "income" ? "income" : "expense",
      amountText: money(state.amount),
      description: state.description,
      categories: prettyCategories(state.categories_path),
      dateText: t("syncReview.from", { month: state.from }),
      attribution,
      shortLabel: t("syncReview.shortLabel", {
        amount: money(state.amount),
        kind: kindLabel.toLowerCase(),
        attribution: attribution.toLowerCase(),
      }),
    };
  }

  // bucket
  const state = item.bucket!.state;
  const attribution = attributionText(state.addedBy, translator);
  return {
    kindLabel: t("syncReview.kind.bucket"),
    description: item.bucket!.name,
    amountText: t("syncReview.monthlyAllowance", { amount: money(state.limit) }),
    dateText:
      state.from === "0000-00"
        ? t("syncReview.fromTheBeginning")
        : t("syncReview.from", { month: state.from }),
    attribution,
    shortLabel: t("syncReview.bucketShortLabel", {
      name: item.bucket!.name,
      attribution: attribution.toLowerCase(),
    }),
  };
};
