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

const getValidationForField = ({ validationTypes = [], customValidations = [], value = '', fieldName = '' }) => {
  const buildInValidations = validationTypes.map(validationType => {
    return defaultValidationRules[validationType.name]({ value, fieldName, message: validationType.message })
  });
  const fullValidations = [...buildInValidations, ...customValidations];
  const validationMessages = fullValidations.map((singleValidation) => {
    const validationMessage = singleValidation();

    return validationMessage;
  });
  const isFieldValid = validationMessages.every(singleValidation => singleValidation === '');

  return { isFieldValid, validationMessages }
};

const getModelValidity = ({ values, validation }) => {
  for (let value in values) {
  }
};

export { getValidationForField, getModelValidity };