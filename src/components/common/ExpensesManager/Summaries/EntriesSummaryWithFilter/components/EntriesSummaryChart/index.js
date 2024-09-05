import { capitalize } from "lodash";
import React from "react";
import DoughnutChart from "../../../../../DoughnutChart";
import { quantitiesToPercentages } from "../../../../../../../helpers/entriesHelper/entriesHelper";

const EntriesSummaryChart = ({ data }) => {
  const summarizedEntriesByCategory = data.reduce(
    (summarizedEntries, entry) => {
      return {
        ...summarizedEntries,
        [entry.categories_path]: summarizedEntries[entry.categories_path]
          ? summarizedEntries[entry.categories_path] + parseFloat(entry.amount)
          : parseFloat(entry.amount),
      };
    },
    {}
  );
  const labels = Object.keys(summarizedEntriesByCategory);
  const chartData = quantitiesToPercentages(
    Object.values(summarizedEntriesByCategory)
  );
  const hasMoreThanOneCategory = chartData.length > 1;
  return (
    hasMoreThanOneCategory && (
      <DoughnutChart
        chartLabel="entry"
        data={{
          labels: labels.map((label) => capitalize(label.split(",")[1])),
          chartData,
        }}
      />
    )
  );
};

export default EntriesSummaryChart;
