// TODO: This file has no colocated unit test; it was edited, not created,
// by the EN/ES translations change. Tracked in:
// https://github.com/rivasvict/react-expenses-manager/issues/187
import DoughnutChart, {
  EXPENSE_SAVINGS_COLORS,
} from "../../../../../common/DoughnutChart";
import { getExpenseSavingsPercentages } from "../../../../../../helpers/entriesHelper/entriesHelper";
import { useTranslation } from "../../../../../../i18n";

const BalanceChart = ({ incomesSum, expensesSum }) => {
  const { t } = useTranslation();
  const totalSum = incomesSum + Math.abs(expensesSum);
  const [expensePercentage, savingsPercentage] = getExpenseSavingsPercentages(
    incomesSum,
    expensesSum
  );

  return (
    <DoughnutChart
      data={{
        labels: [t("common.expenses"), t("common.savings")],
        chartData: [expensePercentage, savingsPercentage],
      }}
      colors={EXPENSE_SAVINGS_COLORS}
      shouldShow={!!totalSum}
    />
  );
};

export default BalanceChart;
