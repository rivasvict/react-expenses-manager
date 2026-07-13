// Pure display mapping from a diffed SyncItem to the review card's facts
// (DESIGN 4.3.1): kind badge, money fields, attribution and the
// item-specific accessible action labels.
import dayjs from "dayjs";
import { SyncItem } from "../../helpers/syncMergeHelper/syncMergeHelper";
import { CURRENCY_SYMBOL } from "../../constants";
import { AddedBy } from "../../services/session";

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

const attributionText = (addedBy?: AddedBy): string =>
  // AC-1.6/AC-3.4 — legacy/unattributed items show the anonymous fallback.
  addedBy && addedBy.name ? `Added by ${addedBy.name}` : "Added anonymously";

export const getItemFacts = (item: SyncItem): ItemFacts => {
  if (item.kind === "entry") {
    const entry = item.entry;
    const kindLabel = entry.type === "income" ? "Income" : "Expense";
    const attribution = attributionText(entry.addedBy);
    return {
      kindLabel,
      tone: entry.type,
      amountText: money(entry.amount),
      description: entry.description,
      categories: prettyCategories(entry.categories_path),
      dateText: dayjs(entry.date).format("MMM D, YYYY"),
      attribution,
      shortLabel: `${money(entry.amount)} ${kindLabel.toLowerCase()} ${attribution.toLowerCase()}`,
    };
  }

  if (item.kind === "fixed" && item.fixed) {
    const state = item.fixed.state;
    const kindLabel =
      item.fixed.type === "income" ? "Fixed Income" : "Fixed Expense";
    const attribution = attributionText(state.addedBy);
    if (state.removed) {
      return {
        kindLabel,
        removed: true,
        dateText: `Removed from ${state.from}`,
        attribution,
        shortLabel: `${kindLabel.toLowerCase()} removal ${attribution.toLowerCase()}`,
      };
    }
    return {
      kindLabel,
      tone: item.fixed.type === "income" ? "income" : "expense",
      amountText: money(state.amount),
      description: state.description,
      categories: prettyCategories(state.categories_path),
      dateText: `From ${state.from}`,
      attribution,
      shortLabel: `${money(state.amount)} ${kindLabel.toLowerCase()} ${attribution.toLowerCase()}`,
    };
  }

  // bucket
  const state = item.bucket!.state;
  const attribution = attributionText(state.addedBy);
  return {
    kindLabel: "Bucket",
    description: item.bucket!.name,
    amountText: `${money(state.limit)} monthly allowance`,
    dateText:
      state.from === "0000-00" ? "From the beginning" : `From ${state.from}`,
    attribution,
    shortLabel: `${item.bucket!.name} bucket ${attribution.toLowerCase()}`,
  };
};
