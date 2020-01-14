import React from 'react';

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
  const { validationTypes = [], customValidations = [], value = '', isFormValid } = props;
  const buildInValidations = validationTypes.map(validationType => {
    return defaultValidationRules[validationType.name]({ value, fieldName: props.children.props.name, message: validationType.message })
  });
  const fullValidations = [...buildInValidations, ...customValidations];
  const validationMessages = fullValidations.map((singleValidation) => {
    const validationMessage = singleValidation();
    const hasValidationMessage = validationMessage ? true : false;
    if (props.checkForValidity && !isFormValid !== hasValidationMessage) {
      props.checkForValidity(validationMessage);
    }

    return validationMessage;
  });
  const isFieldValid = validationMessages.every(singleValidation => singleValidation === '');
  const validationMessagesWithTemplate = validationMessages.map((validationMessage, index) => <label key={index}>{validationMessage}</label>)

  return (
    <div>{props.children}{isFieldValid ? null : validationMessagesWithTemplate}</div>
  )
}

export default ValidateField;