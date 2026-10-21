import React from "react";
import { useTranslation } from "../../../../i18n";
import type { MonthDate } from "../../../../helpers/savingsChange/savingsChange";
import { getMonthLabel } from "../../../../helpers/savingsTrend/monthLabels";
import type { TrendRangeState } from "../TrendRangeContext";
import HistoryNotice from "../HistoryNotice";

/**
 * The history notice for a range that cannot be drawn: one that reaches before
 * the first recorded month (with an action to compare with that month), or no
 * earlier month at all. Renders nothing for a range that is ready.
 */
const RangeNotice = ({ range: { resolved, setPicked } }: { range: TrendRangeState }) => {
  const { t, language } = useTranslation();
  const monthName = (date: MonthDate) =>
    `${getMonthLabel(date.month, language, "sentence")} ${date.year}`;

  if (resolved.status === "short") {
    const month = monthName(resolved.earliest);
    return (
      <HistoryNotice
        title={t("savingsTrend.short.title")}
        body={t("savingsTrend.short.body", { month })}
        action={{
          label: t("savingsTrend.short.action", { month }),
          onClick: () => setPicked({ kind: "custom", monthsBack: resolved.monthsBack }),
        }}
      />
    );
  }
  if (resolved.status === "empty") {
    return (
      <HistoryNotice title={t("savingsTrend.empty.title")} body={t("savingsTrend.empty.body")} />
    );
  }
  return null;
};

export default RangeNotice;
