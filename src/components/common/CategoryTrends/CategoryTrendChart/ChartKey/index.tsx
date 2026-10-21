import React from "react";
import { useTranslation } from "../../../../../i18n";
import type { CategoryType } from "../../../../../helpers/categoryLists/categoryLists";
import type { CategoryTrendView } from "..";

interface ChartKeyProps {
  view: CategoryTrendView;
  type: CategoryType;
  /** The reference month's name, mid-sentence ("April"). */
  reference: string;
}

/**
 * The legend under the category chart: the gold line on Per month; on Change,
 * the dashed reference line, then Less and More, each in the colour its news
 * is for the category's type (less spent is green, less earned is red).
 */
const ChartKey = ({ view, type, reference }: ChartKeyProps) => {
  const { t } = useTranslation();
  const isIncome = type === "income";
  if (view === "perMonth") {
    return (
      <div className="category-trend-chart__key">
        <span>
          <span className="category-trend-chart__swatch category-trend-chart__swatch--month" />
          {t(isIncome ? "categoryTrends.key.earnedMonth" : "categoryTrends.key.spentMonth")}
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
