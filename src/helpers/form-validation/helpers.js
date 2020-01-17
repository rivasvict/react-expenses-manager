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

const isModelValid = ({ values, validation }) => {
  let modelValidationMessages = [];
  for (let fieldName in values) {
    const value = values[fieldName];
    const builtInValidationMessages = validation[fieldName].buildInValidations.reduce((validationMessages, currentValidation) => {
      const builtInValidationMessage = defaultValidationRules[currentValidation.name]({ value, fieldName, message: currentValidation.message })();

      if (builtInValidationMessage !== '') {
        return [...validationMessages, builtInValidationMessage];
      }

      return validationMessages;
    }, []);

    const customValidationMessages = validation[fieldName].customValidations.reduce((validationMessages, currentValidation) => {
      const customValidationMessage = currentValidation(value);

      if (customValidationMessage !== '') {
        return [...validationMessages, customValidationMessage];
      }

      return validationMessages;
    }, []);

    modelValidationMessages = [ ...builtInValidationMessages, ...customValidationMessages, ...modelValidationMessages ];
  }

  return modelValidationMessages.length === 0 ? true : false;
};

export { getValidationForField, isModelValid };