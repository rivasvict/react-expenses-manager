import { Col, Row } from "react-bootstrap";
import "./styles.scss";

const ChartContainerRowWrapper = ({ children: chart }) => {
  return (
    <Row className="chart-container">
      <Col className="chart-container__col">{chart}</Col>
    </Row>
  );
};

export default ChartContainerRowWrapper;
