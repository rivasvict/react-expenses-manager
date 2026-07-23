import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import "./NoSessionContainer.scss";
import BrandMark from "./BrandMark";

function NoSessionContainer({ children }) {
  return (
    <Container>
      <Row className="NoSessionContainer">
        <Col className="upperSide">
          <BrandMark size={96} className="logo" title="Expenses Tracker logo" />
        </Col>
        <Col>{children}</Col>
      </Row>
    </Container>
  );
}

export default NoSessionContainer;
