import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import './NoSessionContainer.scss';
import logoImage from '../../images/expenses_tracker_logo.png';

function NoSessionContainer({ children }) {
  return (
    <Container>
      <Row className='NoSessionContainer'>
        <Col className='upperSide'>
          <img src={logoImage} alt='Expenses tracker logo' className='logo'/>
        </Col>
        <Col>
          {children}
        </Col>
      </Row>
    </Container>
  )
};

export default NoSessionContainer;