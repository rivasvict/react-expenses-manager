import { capitalize } from "lodash";
import React from "react";
import DoughnutChart from "../../../../../DoughnutChart";
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
      />
    )
  );
};

export default SummaryChart;
