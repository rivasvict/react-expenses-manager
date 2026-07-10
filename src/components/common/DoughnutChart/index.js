import { Chart } from "chart.js/auto";
import { useEffect, useRef } from "react";

/**
 * Categorical palette validated for the app's dark surface (#161b22) with the
 * dataviz six-checks validator (lightness band, chroma floor, adjacent-pair
 * CVD separation, contrast). Hues are assigned in this fixed order — never
 * cycled — and the surface-colored slice borders act as the spacer that keeps
 * adjacent slices distinguishable for color-vision deficiencies.
 */
const CATEGORICAL_COLORS = [
  "#3987e5", // blue
  "#199e70", // aqua
  "#c98500", // yellow
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
  "#d55181", // magenta
  "#d95926", // orange
];

const SURFACE_COLOR = "#161b22";
const LEGEND_TEXT_COLOR = "#9aa4b2";

const DoughnutChart = ({ chartLabel, data, colors, shouldShow = true }) => {
  const { labels, chartData } = data;
  const chartRef = useRef(null);
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
              backgroundColor: colors || CATEGORICAL_COLORS,
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
  }, [labels, chartData, chartLabel, colors]);

  return !!chartData.length && shouldShow && <canvas ref={chartRef} />;
};

export default DoughnutChart;
