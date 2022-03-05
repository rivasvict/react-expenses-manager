import React from "react";
import { Col, Row } from "react-bootstrap";
import RowLink from "./RowLink";
import './ContentTitleSelection.scss';

const RowContent = ({ children }) => (
  <React.Fragment>
    <Col xs={12}>
      {children}
    </Col>
    <hr/>
  </React.Fragment>
);

const ContentTileSection = ({ title = 'Content title section', to, className = '', children }) => (
  <React.Fragment>
    { to ?
      <RowLink title={title} to={to} className={`content-title-selection ${className}`}>
        <RowContent>{children}</RowContent>
      </RowLink>
      :
      <Row title={title} className={`content-title-selection ${className}`}>
        <RowContent>{children}</RowContent>
      </Row>
    }
  </React.Fragment>
);

export default ContentTileSection;