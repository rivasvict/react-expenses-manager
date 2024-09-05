import { capitalize } from "lodash";
import DoughnutChart from "../../../../../common/DoughnutChart";
import { ENTRY_TYPES_PLURAL } from "../../../../../../constants";
import { quantitiesToPercentages } from "../../../../../../helpers/entriesHelper/entriesHelper";

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
      shouldShow={!!totalSum}
    />
  );
};

export default BalanceChart;
