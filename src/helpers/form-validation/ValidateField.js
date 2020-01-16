import React, { useContext } from 'react';
import { ValidationContext } from './FormValidation';

const defaultValidationRules = {
  required: ({ value, fieldName, message }) => () => {
    const validationMessage = message || `${fieldName} is required, please insert it`;
    return !value.length ? validationMessage : '';
  },
  email: ({ value, fieldName, message }) => () => {
    const validationMessage = message || `${fieldName} has a wrong email format`;
    const emailPattern = /@/g;
    return value.match(emailPattern) ? validationMessage : '';
  }
};

function ValidateField(props) {
  // TODO
  const { values } = useContext(ValidationContext);

  const { validationTypes = [], customValidations = [], value = '' } = props;
  const buildInValidations = validationTypes.map(validationType => {
    return defaultValidationRules[validationType.name]({ value, fieldName: props.children.props.name, message: validationType.message })
  });
  const fullValidations = [...buildInValidations, ...customValidations];
  const validationMessages = fullValidations.map((singleValidation) => {
    const validationMessage = singleValidation();

    return validationMessage;
  });
  const isFieldValid = validationMessages.every(singleValidation => singleValidation === '');
  const validationMessagesWithTemplate = validationMessages.map((validationMessage, index) => <label key={index}>{validationMessage}</label>)
  // checkValidityOfForm({ isFieldValid, dispatch });

  return (
    <div>{props.children}{isFieldValid ? null : validationMessagesWithTemplate}</div>
  )
}

export default ValidateField;