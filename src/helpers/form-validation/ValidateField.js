import React, { useContext } from 'react';
import { getValidationForField } from './helpers';
import { ValidationContext } from './FormValidation';

function ValidateField({ children, globalStyles = {}, labelStyles = {}}) {
  const { formState } = useContext(ValidationContext);
  try {
    const childrenProps = children.props;
    const fieldName = childrenProps.name;
    const { validation, values } = formState;
    const validationTypes = validation[childrenProps.name].buildInValidations;
    const customValidations = validation[childrenProps.name].customValidations;
    const { validationMessages, isFieldValid } = getValidationForField({ validationTypes, customValidations, values, fieldName });
    const validationMessagesWithTemplate = validationMessages.map((validationMessage, index) => <label styles={labelStyles} key={index}>{validationMessage}</label>)

    return (
      <div styles={globalStyles}>{children}{isFieldValid ? null : validationMessagesWithTemplate}</div>
    )
  } catch(error) {
    console.log(error);
    return (
      <div>ERROR: Validation component cannot work without validations defined for its model</div>
    )
  }
}

export default ValidateField;