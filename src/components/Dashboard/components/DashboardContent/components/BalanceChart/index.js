import DoughnutChart from "../../../../../common/DoughnutChart";

const BalanceChart = ({ incomesSum, expensesSum }) => {
  const totalSum = incomesSum + Math.abs(expensesSum);
  const incomePercentage = (incomesSum / totalSum) * 100;
  const expensePercentage = (Math.abs(expensesSum) / totalSum) * 100;

  return (
    <DoughnutChart
      data={{
        labels: ["Incomes", "Expenses"],
        chartData: [incomePercentage, expensePercentage],
      }}
      shouldShow={!!totalSum}
    />
  );
};

export default BalanceChart;
