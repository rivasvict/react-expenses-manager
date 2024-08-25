import React from "react";
import { Col, Container, Navbar, Row } from "react-bootstrap";
import { connect } from "react-redux";
import logoImage from "../../images/expenses_tracker_logo.png";
import { logOut } from "../../redux/userManager/actoionCreators";
import ButtonLikeLink from "./ButtonLikeLink";
import "./Header.scss";

const Header = ({ onLogOut }) => (
  <header>
    <Navbar expand="md" variant="dark">
      <Navbar.Brand href="#home">
        <img src={logoImage} alt="Expenses tracker logo" className="logo" />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <ButtonLikeLink to="/" buttonTitle="Home" />
        {/**
         * TODO:
         * Reinstate <AuthenticatedApp />
         * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
         */}
        {/* <Button block type='submit' variant='secondary' onClick={onLogOut}>Sign out</Button> */}
      </Navbar.Collapse>
    </Navbar>
    <Container>
      <Row className="header-info">
        <Col xs={12} className="sub-title">
          <h3>Month Balance</h3>
        </Col>
      </Row>
    </Container>
  </header>
);

const mapActionsToProps = (dispatch) => ({
  onLogOut: () => dispatch(logOut()),
});

export default connect(null, mapActionsToProps)(Header);
