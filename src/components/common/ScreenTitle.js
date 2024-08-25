import React from "react";
import { Col, Row } from "react-bootstrap";
import "./ScreenTitle.scss";

function ScreenTitle({ screenTitle }) {
  return (
    <Row className="screen-title">
      <Col xs={12}>
        <h1 className="title">{screenTitle}</h1>
      </Col>
    </Row>
  );
}

export default ScreenTitle;
