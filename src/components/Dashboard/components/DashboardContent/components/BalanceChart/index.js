import DoughnutChart, {
  EXPENSE_SAVINGS_COLORS,
} from "../../../../../common/DoughnutChart";
import { getExpenseSavingsPercentages } from "../../../../../../helpers/entriesHelper/entriesHelper";

const BalanceChart = ({ incomesSum, expensesSum }) => {
  const totalSum = incomesSum + Math.abs(expensesSum);
  const [expensePercentage, savingsPercentage] = getExpenseSavingsPercentages(
    incomesSum,
    expensesSum
  );

  return (
    <DoughnutChart
      data={{
        labels: ["Expenses", "Savings"],
        chartData: [expensePercentage, savingsPercentage],
      }}
      colors={EXPENSE_SAVINGS_COLORS}
      shouldShow={!!totalSum}
    />
  );
};

export default BalanceChart;
