import { capitalize } from "lodash";
import React from "react";
import DoughnutChart from "../../../../../DoughnutChart";
import { quantitiesToPercentages } from "../../../../../../../helpers/entriesHelper/entriesHelper";

// This chart always plots incomes vs. expenses, so it uses the same semantic
// green/red pair as the dashboard balance chart. Module scope keeps the
// array reference stable across renders.
const SUMMARY_COLORS = ["#199e70", "#e66767"];

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
        colors={SUMMARY_COLORS}
      />
    )
  );
};

export default SummaryChart;
