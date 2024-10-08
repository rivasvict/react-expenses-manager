import React from "react";
import { Button, Container, Form, Row } from "react-bootstrap";

const GenericInput = (props) => (
  <Form.Control {...props} className={`text ${props.className}`} />
);

const InputText = (props) => (
  <GenericInput
    {...{ ...props, type: "text" }}
    className={`text ${props.className}`}
  />
);

const InputNumber = (props) => (
  <GenericInput {...{ ...props, type: "number" }} />
);

const InputPassword = (props) => (
  <GenericInput {...{ ...props, type: "password" }} />
);

const FormButton = (props) => <Button {...props} block="true"></Button>;

/** 
  Once react-bootstrap is updated to v2,
  Make sure to update the way this select control
  is implemented as described at
  https://react-bootstrap.netlify.app/forms/select/
  (with Form.Select)
*/
const FormSelect = (props) => (
  <Form.Control as="select" {...props}>
    {props.children}
  </Form.Control>
);

const FormContent = ({ children, render, formProps = {}, className }) => (
  <Container className="form-container" fluid>
    <Row as={Form} {...formProps}>
      {render ? render() : children}
    </Row>
  </Container>
);

export {
  InputText,
  InputPassword,
  InputNumber,
  FormButton,
  FormSelect,
  FormContent,
};
