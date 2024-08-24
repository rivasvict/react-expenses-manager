import React from "react";
import { Col } from "react-bootstrap";
import "./WorkAreaContentContainer.scss";

const WorkAreaContentContainer = ({ children }) => (
  <Col
    xs={12}
    className="work-area-content-container vertical-standard-space-padding"
  >
    {children}
  </Col>
);

export default WorkAreaContentContainer;
