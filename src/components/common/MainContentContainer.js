import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import "./MainContentContainer.scss";

export const MainContentContainer = ({
  className = "",
  children,
  fluid = false,
  pageTitle = "",
}) => (
  <Container className={`main-content-container ${className}`} fluid={fluid}>
    {pageTitle && (
      <Container>
        <Row className="header-info">
          <Col xs={12} className="sub-title">
            <h3>{pageTitle}</h3>
          </Col>
        </Row>
      </Container>
    )}
    {children}
  </Container>
);
