import { Chart } from "chart.js/auto";
import { useEffect, useRef } from "react";

const DoughnutChart = ({ chartLabel, data }) => {
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
              hoverOffset: 4,
              backgroundColor: [
                "rgb(240 185 11)", // Yellowish
                "rgb(112 122 138)", // Grayish-blue
                "rgb(135, 60, 95)", // A reddish-pink color
                "rgb(30, 150, 190)", // A light blue color
                "rgb(60, 180, 75)", // A green color
                "rgb(255, 105, 180)", // Hot pink
                "rgb(190, 75, 220)", // Purple
                "rgb(255, 140, 0)", // Dark orange
                "rgb(0, 128, 128)", // Teal
                "rgb(75, 0, 130)", // Indigo
                "rgb(255, 69, 0)", // Red-orange
                "rgb(0, 255, 127)", // Spring green
                "rgb(0, 100, 0)", // Dark green
                "rgb(255, 20, 147)", // Deep pink
                "rgb(64, 224, 208)", // Turquoise
              ],
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: true,
              labels: {
                color: "white",
              },
            },
          },
        },
      });
      return () => {
        chart.destroy();
      };
    }
  }, [labels, chartData, chartLabel]);

  return chartData.length && <canvas ref={chartRef} />;
};

export default DoughnutChart;
