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
    const builtInValidationMessages = validation[fieldName] && validation[fieldName].buildInValidations ? validation[fieldName].buildInValidations.reduce((validationMessages, currentValidation) => {
      const builtInValidationMessage = defaultValidationRules[currentValidation.name]({ value, fieldName, message: currentValidation.message })();

      if (builtInValidationMessage !== '') {
        return [...validationMessages, builtInValidationMessage];
      }

      return validationMessages;
    }, []) : [];

    const customValidationMessages = validation[fieldName] && validation[fieldName].customValidations ? validation[fieldName].customValidations.reduce((validationMessages, currentValidation) => {
      const customValidationMessage = currentValidation(value);

      if (customValidationMessage !== '') {
        return [...validationMessages, customValidationMessage];
      }

      return validationMessages;
    }, []) : [];

    modelValidationMessages = [ ...builtInValidationMessages, ...customValidationMessages, ...modelValidationMessages ];
  }

  return modelValidationMessages.length === 0 ? true : false;
};

const getDefaultValidationsObject = () => {
  return {
    customValidations: [],
    buildInValidations: []
  }
}

const BuildFormModel = (modelValues) => {
  if (!modelValues) {
    throw new Error('No values have been set for this form, please send them as an object parameter');
  }

  const model = {
    values: modelValues,
    validation: {},
    isModelValid: false
  };

  const builder = {
    addCustomValidationToField: ({ fieldName, validation }) => {
      const existingFieldValidation = model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {...model.validation, [fieldName]: {
          customValidations: [...existingFieldValidation.customValidations, validation],
          buildInValidations: [...existingFieldValidation.buildInValidations]
        },
      };

      return model;
    },
    addCustomValidationsToField: ({ fieldName, validations }) => {
      const existingFieldValidation = model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {...model.validation, [fieldName]: {
          customValidations: [...existingFieldValidation.customValidations, ...validations],
          buildInValidations: [...existingFieldValidation.buildInValidations]
        },
      };

      return model;
    },
    addBuiltInValidationToField: ({ fieldName, validation }) => {
      const existingFieldValidation = model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {...model.validation, [fieldName]: {
          buildInValidations: [...existingFieldValidation.buildInValidations, validation],
          customValidations: [...existingFieldValidation.customValidations]
        },
      };

      return model;
    },
    addBuiltInValidationsToField: ({ fieldName, validations }) => {
      const existingFieldValidation = model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {...model.validation, [fieldName]: {
          buildInValidations: [...existingFieldValidation.buildInValidations, ...validations],
          customValidations: [...existingFieldValidation.customValidations]
        },
      };

      return model;
    },
    setModelInitialValidityState: (validationInitialState) => {
      model.isModelValid = validationInitialState;

      return model;
    },
  }

  Object.setPrototypeOf(model, builder);

  return model;
};

export { getValidationForField, isModelValid, BuildFormModel };