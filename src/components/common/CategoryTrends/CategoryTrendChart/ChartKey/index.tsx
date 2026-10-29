import React from "react";
import { useTranslation } from "../../../../../i18n";
import type { CategoryType } from "../../../../../helpers/categoryLists/categoryLists";
import type { CategoryTone } from "../../../../../helpers/categoryTrends/categoryTrends.types";
import type { CategoryTrendView } from "..";

interface ChartKeyProps {
  view: CategoryTrendView;
  type: CategoryType;
  /** Whether the range as a whole is good news, bad news or no change. */
  tone: CategoryTone;
  /** The reference month's name, mid-sentence ("April"). */
  reference: string;
}

/**
 * The legend under the category chart: on Per month, which way the range went
 * (up, down or the same) in the tone of that news; on Change,
 * the dashed reference line, then Less and More, each in the colour its news
 * is for the category's type (less spent is green, less earned is red).
 */
const ChartKey = ({ view, type, tone, reference }: ChartKeyProps) => {
  const { t } = useTranslation();
  const isIncome = type === "income";
  if (view === "perMonth") {
    // More spent, or less earned, is bad news; so the direction follows the tone.
    const goesUp = isIncome === (tone === "good");
    const direction = tone === "flat" ? "Flat" : goesUp ? "Up" : "Down";
    return (
      <div className="category-trend-chart__key">
        <span>
          <span className={`category-trend-chart__swatch category-trend-chart__swatch--${tone}`} />
          {t(`categoryTrends.key.${isIncome ? "income" : "spending"}${direction}`, { reference })}
        </span>
      </div>
    );
  }
  return (
    <div className="category-trend-chart__key">
      <span>
        <span className="category-trend-chart__swatch category-trend-chart__swatch--reference" />
        {t(isIncome ? "categoryTrends.key.earned" : "categoryTrends.key.spent", { reference })}
      </span>
      <span>
        <span className={`category-trend-chart__swatch category-trend-chart__swatch--${isIncome ? "bad" : "good"}`} />
        {t("categoryTrends.key.less")}
      </span>
      <span>
        <span className={`category-trend-chart__swatch category-trend-chart__swatch--${isIncome ? "good" : "bad"}`} />
        {t("categoryTrends.key.more")}
      </span>
    </div>
  );
};

export default ChartKey;
