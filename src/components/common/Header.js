import React, { useRef } from "react";
import { Navbar } from "react-bootstrap";
import { connect } from "react-redux";
import logoImage from "../../images/expenses_tracker_logo.png";
/**
 * TODO:
 * Reinstate this import
 * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
 */
// import { logOut } from "../../redux/userManager/actionCreators";
import ButtonLikeLink from "./ButtonLikeLink";
import "./Header.scss";

const Header = () => {
  const toggleRef = useRef(null);

  const closeToggle = () => {
    toggleRef.current.click();
  };

  return (
    <header>
      <Navbar expand="md" variant="dark">
        <Navbar.Brand href="#home">
          <img src={logoImage} alt="Expenses tracker logo" className="logo" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" ref={toggleRef} />
        <Navbar.Collapse id="basic-navbar-nav">
          <ButtonLikeLink to="/" buttonTitle="Home" onClick={closeToggle} />
          <ButtonLikeLink
            to="/data-management"
            buttonTitle="Data Management"
            onClick={closeToggle}
          />
          {/**
           * TODO:
           * Reinstate this button
           * https://github.com/users/rivasvict/projects/3/views/1?pane=issue&itemId=75192915
           */}
          {/* <Button block type='submit' variant='secondary' onClick={onLogOut}>Sign out</Button> */}
        </Navbar.Collapse>
      </Navbar>
    </header>
  );
};

const mapActionsToProps = (dispatch) => ({
  // onLogOut: () => dispatch(logOut()),
});

export default connect(null, mapActionsToProps)(Header);
