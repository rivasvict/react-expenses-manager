import { Col, Row } from "react-bootstrap";
import "./styles.scss";

const ChartContainerRowWrapper = ({ children: chart }) => {
  return (
    <Row className="chart-container">
      <Col xs={10} md={4}>
        {chart}
      </Col>
    </Row>
  );
};

export default ChartContainerRowWrapper;
