import React from 'react';
import { Button, Form, Row } from 'react-bootstrap';

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

{/** Once react-bootstrap is updated to v2,
  Make sure to update the way this select control
  is implemented as described at
  https://react-bootstrap.netlify.app/forms/select/
  (with Form.Select)
*/}
const FormSelect = (props) => (
  <Form.Control as='select' {...props}>{props.children}</Form.Control>
);

const FormContent = ({ children, render, formProps = {} }) => (
  <Row as={Form} {...formProps}>
    {render ? render() : children}
  </Row>
);

export { InputText, InputPassword, InputNumber, FormButton, FormSelect, FormContent };