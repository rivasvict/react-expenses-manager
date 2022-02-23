import React from 'react';
import { Container } from 'react-bootstrap';
import './NoSessionContainer.scss';
import logoImage from '../../images/expenses_tracker_logo.png';

function NoSessionContainer({ children }) {
  return (
    <Container className='NoSessionContainer'>
      <img src={logoImage} alt='Expenses tracker logo' className='logo'/>
      {children}
    </Container>
  )
};

export default NoSessionContainer;