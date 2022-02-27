import React from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';

const GenericInput = (props) => (
  <Form.Control {...props} className='text' />
);

const InputText = (props) => (
  <GenericInput {... { ...props, type: 'text' }} />
);

const InputNumber = (props) => (
  <GenericInput {... { ...props, type: 'number' }} />
);

const InputPassword = (props) => (
  <GenericInput {... { ...props, type: 'password' }} />
);

const FormButton = (props) => (
  <Button {...props} block></Button>
);

const FormSelect = (props) => (
  <Form.Select {...props}>{props.children}</Form.Select>
);

const FormContent = ({ children, render, formProps }) => (
  <Row as={Form} {...formProps}>
    <Col xs={12}>
      {render ? render() : children}
    </Col>
  </Row>
);

export { InputText, InputPassword, InputNumber, FormButton, FormSelect, FormContent };