import React from 'react';
import { Col, Container, Nav, Navbar, Row } from 'react-bootstrap';
import logoImage from '../../images/expenses_tracker_logo.png';
import './Header.scss';

const Header = () => (
  <header>
    <Navbar expand="md">
      <Navbar.Brand href="#home">
        <img src={logoImage} alt='Expenses tracker logo' className='logo'/>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav.Link href='/'>home</Nav.Link>
      </Navbar.Collapse>
    </Navbar>
    <Container>
      <Row className='header-info'>
        <Col xs={12} className='sub-title'>
          <h3>Month Balance</h3>
        </Col>
        <Col xs={5}>Salary</Col>
        <Col xs={4}>2.500,00 CAD</Col>
      </Row>
    </Container>
  </header>
);

export default Header;