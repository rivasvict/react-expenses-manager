import React from 'react';
import { Container } from 'react-bootstrap';
import './MainContentContainer.scss';

export const MainContentContainer = ({ className = '', children, fluid = false }) => (
  <Container className={`main-content-container ${className}`} fluid={fluid}>
    {children}
  </Container>
);
