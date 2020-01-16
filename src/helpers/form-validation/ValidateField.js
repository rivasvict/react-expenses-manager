import React from 'react';
import { getValidationForField } from './helpers';

function ValidateField(props) {
  const { validationTypes = [], customValidations = [], value = '', fieldName } = props;
  const { validationMessages, isFieldValid } = getValidationForField({ validationTypes, customValidations, value, fieldName });
  const validationMessagesWithTemplate = validationMessages.map((validationMessage, index) => <label key={index}>{validationMessage}</label>)

  return (
    <div>{props.children}{isFieldValid ? null : validationMessagesWithTemplate}</div>
  )
}

export default ValidateField;