import { Col, Row } from "react-bootstrap";
import EntriesSummaryChart from "../ExpensesManager/Summaries/EntriesSummaryWithFilter/components/EntriesSummaryChart";
import EntriesSummary from "../ExpensesManager/Summaries/EntriesSummary";

const SummaryWithChart = ({ entries, name }) => {
  return (
    <>
      <Row className="chart-container">
        <Col xs={6}>
          <EntriesSummaryChart data={entries} />
        </Col>
      </Row>
      <EntriesSummary entries={entries} name={name} />
    </>
  );
};

export default SummaryWithChart;
