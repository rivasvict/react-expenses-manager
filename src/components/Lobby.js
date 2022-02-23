import React from 'react';
import { Link, Redirect, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import SignIn from './SignIn/SignIn';
import { Col, Container, Row } from 'react-bootstrap';
import './Lobby.scss';

function Lobby({ user, isLoading }) {
  const location = useLocation();
  const from = location?.state?.from;
  const isThereAnyUser = user && user.email;

  return (
    <Container className='Lobby' fluid>
      {
        // TODO: Add a proper component for loading  and implement it with better code readability
        !isThereAnyUser ? isLoading ? <div style={{color: 'white', fontSize: '3rem'}}>Loading...</div> :
          <SignIn />
          : <Redirect to={{ pathname: from ? from.pathname : '/dashboard' }} />
      }
    </Container>
  )
}

const mapStateToProps = state => ({
  user: state.userManager.user,
  isLoading: state.userManager.isLoading
});

export default connect(mapStateToProps)(Lobby);