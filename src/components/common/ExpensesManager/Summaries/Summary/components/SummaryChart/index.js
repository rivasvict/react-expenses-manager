import { capitalize } from "lodash";
import React from "react";
import DoughnutChart from "../../../../../DoughnutChart";

const SummaryChart = ({ data, totalSum }) => {
  const labels = Object.keys(data);
  const chartData = Object.values(data).map((value) => {
    return Math.abs(value / totalSum) * 100;
  });
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
