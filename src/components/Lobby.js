import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { connect } from 'react-redux';
import SignIn from './SignIn/SignIn';
import { Col, Container, Row } from 'react-bootstrap';
import './Lobby.scss';

function Lobby({ user }) {
  const isThereAnyUser = () => user && user.email;
  const history = useHistory();

  useState(() => {
    if (isThereAnyUser()) {
      history.push('/dashboard');
    }
  })

  return (
    <Container className='Lobby'>
      <Row>
        {
          !isThereAnyUser() ?
            <Col>
              <SignIn />
              <Link className='btn btn-secondary' to='/sign-up'>Sign up</Link>
            </Col>
            : null
        }
      </Row>
    </Container>
  )
}

const mapStateToProps = state => ({
  user: state.userManager.user
});

export default connect(mapStateToProps)(Lobby);