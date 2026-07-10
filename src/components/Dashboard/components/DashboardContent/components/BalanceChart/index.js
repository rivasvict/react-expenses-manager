import { capitalize } from "lodash";
import DoughnutChart from "../../../../../common/DoughnutChart";
import { ENTRY_TYPES_PLURAL } from "../../../../../../constants";
import { quantitiesToPercentages } from "../../../../../../helpers/entriesHelper/entriesHelper";

// Semantic pair (income green / expense red), validated for the dark
// surface; the legend plus slice gaps carry identity beyond color. Kept at
// module scope so the chart effect doesn't re-run on every render.
const BALANCE_COLORS = ["#199e70", "#e66767"];

const BalanceChart = ({ incomesSum, expensesSum }) => {
  const totalSum = incomesSum + Math.abs(expensesSum);
  const [incomePercentage, expensePercentage] = quantitiesToPercentages([
    incomesSum,
    expensesSum,
  ]);

  return (
    <DoughnutChart
      data={{
        labels: [
          capitalize(ENTRY_TYPES_PLURAL.INCOMES),
          capitalize(ENTRY_TYPES_PLURAL.EXPENSES),
        ],
        chartData: [incomePercentage, expensePercentage],
      }}
      colors={BALANCE_COLORS}
      shouldShow={!!totalSum}
    />
  );
};

export default BalanceChart;
