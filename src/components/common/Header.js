import React from 'react';
import { Col, Container, Form, Nav, Navbar, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import logoImage from '../../images/expenses_tracker_logo.png';
import { logOut } from '../../redux/userManager/actoionCreators';
import { FormButton } from './Forms';
import './Header.scss';

const Header = ({ onLogOut }) => (
  <header>
    <Navbar expand="md">
      <Navbar.Brand href="#home">
        <img src={logoImage} alt='Expenses tracker logo' className='logo'/>
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav.Link href='/'>home</Nav.Link>
        <Form onSubmit={onLogOut}>
          <Form.Group>
            <FormButton type='submit' variant='secondary'>Sign out</FormButton>
          </Form.Group>
        </Form>
      </Navbar.Collapse>
    </Navbar>
    <Container>
      <Row className='header-info'>
        <Col xs={12} className='sub-title'>
          <h3>Month Balance</h3>
        </Col>
      </Row>
    </Container>
  </header>
);

const mapActionsToProps = dispatch => ({
  onLogOut: () => dispatch(logOut())
});

export default connect(null, mapActionsToProps)(Header);