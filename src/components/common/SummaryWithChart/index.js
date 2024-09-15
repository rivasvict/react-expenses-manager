import EntriesSummaryChart from "../ExpensesManager/Summaries/EntriesSummaryWithFilter/components/EntriesSummaryChart";
import EntriesSummary from "../ExpensesManager/Summaries/EntriesSummary";
import ChartContainerRowWrapper from "../ChartContainerRowWrapper";

const SummaryWithChart = ({ entries, name, entryType }) => {
  return (
    <>
      <ChartContainerRowWrapper>
        <EntriesSummaryChart data={entries} />
      </ChartContainerRowWrapper>
      <EntriesSummary entries={entries} name={name} entryType={entryType} />
    </>
  );
};

export default SummaryWithChart;
