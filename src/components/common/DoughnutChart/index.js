// TODO: no unit tests cover this file yet — tracked in
// https://github.com/rivasvict/react-expenses-manager/issues/189
import { Chart } from "chart.js/auto";
import { useEffect, useRef } from "react";
import tokens from "../../../styles/tokens.json";

const { chart, color } = tokens;

/**
 * Categorical palette validated for the app's dark surface (#161b22) with the
 * dataviz six-checks validator (lightness band, chroma floor, adjacent-pair
 * CVD separation, contrast). Hues are assigned in this fixed order — never
 * generated. The leading slots deliberately avoid the app's semantic hues
 * (income green, warning amber, expense red), which sit at the tail for the
 * rare 5+ category chart; the surface-colored slice borders act as the
 * spacer that keeps adjacent slices distinguishable for color-vision
 * deficiencies. All values come from src/styles/tokens.json, which also
 * generates their SCSS twins ($chart-*).
 */
const CATEGORICAL_COLORS = [
  chart["chart-categorical-1"], // blue
  chart["chart-categorical-2"], // orange
  chart["chart-categorical-3"], // violet
  chart["chart-categorical-4"], // magenta
  chart["chart-categorical-5"], // green
  chart["chart-categorical-6"], // aqua
  chart["chart-categorical-7"], // amber
  chart["chart-categorical-8"], // red
];

/**
 * Semantic pair for income-vs-expense charts, shared by the dashboard
 * balance donut and the monthly summary donut.
 */
export const INCOME_EXPENSE_COLORS = [
  chart["chart-income"],
  chart["chart-expense"],
];

/**
 * Semantic pair for expense-vs-savings charts (e.g. the dashboard balance
 * donut), where expenses are shown in the warning/expense red and savings
 * reuses the income green to signal "kept" money.
 */
export const EXPENSE_SAVINGS_COLORS = [
  chart["chart-expense"],
  chart["chart-income"],
];

const SURFACE_COLOR = color["bg-surface"];
const LEGEND_TEXT_COLOR = color["text-secondary"];

// One color per slice; charts can have more slices than the palette (users
// create unlimited categories), so wrap around rather than let Chart.js fall
// back to its near-invisible default fill. The legend and slice gaps keep
// repeated hues tellable apart.
const colorsForSlices = (palette, sliceCount) =>
  Array.from(
    { length: sliceCount },
    (unused, index) => palette[index % palette.length]
  );

const DoughnutChart = ({ chartLabel, data, colors, shouldShow = true }) => {
  const { labels, chartData } = data;
  const chartRef = useRef(null);
  // Callers rebuild the labels/data/colors arrays on every render, so the
  // effect keys on their content instead of their identity — otherwise the
  // chart would be destroyed and rebuilt (restarting its animation) on every
  // unrelated re-render.
  const labelsKey = labels.join("|");
  const chartDataKey = chartData.join("|");
  const colorsKey = (colors || CATEGORICAL_COLORS).join("|");
  useEffect(() => {
    if (chartRef.current) {
      const chart = new Chart(chartRef.current, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              label: chartLabel,
              data: chartData,
              hoverOffset: 6,
              backgroundColor: colorsForSlices(
                colors || CATEGORICAL_COLORS,
                chartData.length
              ),
              // A surface-colored gap between slices (the "2px spacer").
              borderColor: SURFACE_COLOR,
              borderWidth: 2,
              borderRadius: 3,
            },
          ],
        },
        options: {
          cutout: "68%",
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: LEGEND_TEXT_COLOR,
                usePointStyle: true,
                pointStyle: "circle",
                boxWidth: 8,
                boxHeight: 8,
                padding: 14,
                font: { size: 12 },
              },
            },
          },
        },
      });
      return () => {
        chart.destroy();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelsKey, chartDataKey, colorsKey, chartLabel]);

  return !!chartData.length && shouldShow && <canvas ref={chartRef} />;
};

export default DoughnutChart;
