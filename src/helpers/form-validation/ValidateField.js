import React, { useContext } from 'react';
import { getValidationForField } from './helpers';
import { ValidationContext } from './FormValidation';

function ValidateField(props) {
  const { formState } = useContext(ValidationContext);
  const childrenProps = props.children.props;
  const fieldName = childrenProps.name;
  const { validation, values } = formState;
  const validationTypes = validation[childrenProps.name].buildInValidations;
  const customValidations = validation[childrenProps.name].customValidations;
  const value = values[fieldName];
  const { validationMessages, isFieldValid } = getValidationForField({ validationTypes, customValidations, value, fieldName });
  const validationMessagesWithTemplate = validationMessages.map((validationMessage, index) => <label key={index}>{validationMessage}</label>)

  return (
    <div>{props.children}{isFieldValid ? null : validationMessagesWithTemplate}</div>
  )
}

export default ValidateField;