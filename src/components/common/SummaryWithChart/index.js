import { Col, Row } from "react-bootstrap";
import EntriesSummaryChart from "../ExpensesManager/Summaries/EntriesSummaryWithFilter/components/EntriesSummaryChart";
import EntriesSummary from "../ExpensesManager/Summaries/EntriesSummary";
import { getSumFromEntries } from "../../../helpers/entriesHelper/entriesHelper";

const SummaryWithChart = ({ entries, name }) => {
  const totalSum = getSumFromEntries(entries);
  return (
    <>
      <Row className="chart-container">
        <Col xs={6}>
          <EntriesSummaryChart data={entries} totalSum={totalSum} />
        </Col>
      </Row>
      <EntriesSummary entries={entries} name={name} />
    </>
  );
};

export default SummaryWithChart;
