import { capitalize } from "lodash";
import React from "react";
import DoughnutChart, {
  INCOME_EXPENSE_COLORS,
} from "../../../../../DoughnutChart";
import { quantitiesToPercentages } from "../../../../../../../helpers/entriesHelper/entriesHelper";

const SummaryChart = ({ data }) => {
  const labels = Object.keys(data);
  const chartData = quantitiesToPercentages(Object.values(data));
  const hasMoreThanOneCategory = chartData.length > 1;

  return (
    hasMoreThanOneCategory && (
      <DoughnutChart
        chartLabel="Type"
        data={{
          labels: labels.map((label) => capitalize(label)),
          chartData,
        }}
        colors={INCOME_EXPENSE_COLORS}
      />
    )
  );
};

export default SummaryChart;
