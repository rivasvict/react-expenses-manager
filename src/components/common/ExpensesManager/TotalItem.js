import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './TotalItem.scss';

function TotalItem({ name, ammount, Icon, url }) {
  return (
    <Link to={`${url}`}>
      <Row className='total-container'>
        <Col xs={6}>
          <Icon />
        </Col>
        <Col xs={6}>
          {ammount}
        </Col>
      </Row>
    </Link>
  );
}

export default TotalItem;
