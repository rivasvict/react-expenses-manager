import React from 'react';
import { Col, Container, Nav, Navbar, Row } from 'react-bootstrap';
import './Header.scss';

const Header = () => (
  <header>
    <Navbar expand="md">
      <Navbar.Brand href="#home">Logo</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav.Link href='/'>home</Nav.Link>
      </Navbar.Collapse>
    </Navbar>
    <Container fluid>
      <Row>
        <Col xs={6}>Month Balance</Col>
        <Col xs={6}>2.500,00 CAD</Col>
      </Row>
    </Container>
  </header>
);

export default Header;