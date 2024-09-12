import EntriesSummaryChart from "../ExpensesManager/Summaries/EntriesSummaryWithFilter/components/EntriesSummaryChart";
import EntriesSummary from "../ExpensesManager/Summaries/EntriesSummary";
import ChartContainerRowWrapper from "../ChartContainerRowWrapper";

const SummaryWithChart = ({ entries, name }) => {
  return (
    <>
      <ChartContainerRowWrapper>
        <EntriesSummaryChart data={entries} />
      </ChartContainerRowWrapper>
      <EntriesSummary entries={entries} name={name} />
    </>
  );
};

export default SummaryWithChart;
