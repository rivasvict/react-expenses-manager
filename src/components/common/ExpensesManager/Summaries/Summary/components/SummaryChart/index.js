// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import React from "react";
import DoughnutChart, {
  INCOME_EXPENSE_COLORS,
} from "../../../../../DoughnutChart";
import { quantitiesToPercentages } from "../../../../../../../helpers/entriesHelper/entriesHelper";
import { useTranslation } from "../../../../../../../i18n";

// `data` is keyed by entry-type plural ("incomes" / "expenses").
const SummaryChart = ({ data }) => {
  const { t } = useTranslation();
  const labels = Object.keys(data);
  const chartData = quantitiesToPercentages(Object.values(data));
  const hasMoreThanOneCategory = chartData.length > 1;

  return (
    hasMoreThanOneCategory && (
      <DoughnutChart
        chartLabel="Type"
        data={{
          labels: labels.map((label) => t(`common.${label}`)),
          chartData,
        }}
        colors={INCOME_EXPENSE_COLORS}
      />
    )
  );
};

export default SummaryChart;
