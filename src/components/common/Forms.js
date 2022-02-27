import React from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

const GenericInput = (props) => (
  <Form.Control {...props} className='text' />
);

const InputText = (props) => (
  <GenericInput {... { ...props, type: 'text' }} />
);

const InputPassword = (props) => (
  <GenericInput {... { ...props, type: 'password' }} />
);

const FormButton = (props) => (
  <Button {...props} block></Button>
);

const FormContent = ({ children, render }) => (
  <Row as={Form}>
    <Col xs={12}>
      {render ? render() : children}
    </Col>
  </Row>
);

export { InputText, InputPassword, FormButton, FormContent };