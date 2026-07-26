import EntriesSummaryChart from "../ExpensesManager/Summaries/EntriesSummaryWithFilter/components/EntriesSummaryChart";
import EntriesSummary from "../ExpensesManager/Summaries/EntriesSummary";
import ChartContainerRowWrapper from "../ChartContainerRowWrapper";

// `listHeader` renders between the chart and the rows (the filters/sort UX
// places its ListSectionHeader there) and suppresses EntriesSummary's
// built-in header so the label never shows twice.
const SummaryWithChart = ({ entries, name, entryType, listHeader }) => {
  return (
    <>
      <ChartContainerRowWrapper>
        <EntriesSummaryChart data={entries} />
      </ChartContainerRowWrapper>
      {listHeader}
      <EntriesSummary
        entries={entries}
        name={name}
        entryType={entryType}
        hideHeader={Boolean(listHeader)}
      />
    </>
  );
};

export default SummaryWithChart;
