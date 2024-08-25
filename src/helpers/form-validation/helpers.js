// TODO: Move into a different file
const defaultValidationRules = {
  required: ({ values, fieldName, message }) => {
    const value = values[fieldName];
    const validationMessage =
      message || `${fieldName} is required, please insert it`;
    return !value.length ? validationMessage : "";
  },
  match: ({ values, fieldName, message, comparatorFieldName }) => {
    const value = values[fieldName];
    const fieldValueToMatch = values[comparatorFieldName];
    const validationMessage = message || `${fieldName}s do not match`;
    return value === fieldValueToMatch ? "" : validationMessage;
  },
};

const getValidationForField = ({
  validationTypes = [],
  customValidations = [],
  values = {},
  fieldName = "",
}) => {
  const validationMessages = getFieldValidationMessages({
    values,
    validation: { customValidations, buildInValidations: validationTypes },
    fieldName,
  });
  const isFieldValid = validationMessages.every(
    (singleValidation) => singleValidation === "",
  );

  return { isFieldValid, validationMessages };
};

const getCustomValidationMessages = ({ values, validation, fieldName }) => {
  return validation && validation.customValidations
    ? validation.customValidations.reduce(
        (validationMessages, currentValidation) => {
          const customValidationMessage = currentValidation({
            values,
            fieldName,
          });

          if (customValidationMessage !== "") {
            return [...validationMessages, customValidationMessage];
          }

          return validationMessages;
        },
        [],
      )
    : [];
};

const getBuiltInValidationMessages = ({ validation, values, fieldName }) => {
  return validation && validation.buildInValidations
    ? validation.buildInValidations.reduce(
        (validationMessages, currentValidation) => {
          if (defaultValidationRules[currentValidation.name]) {
            const builtInValidationMessage = defaultValidationRules[
              currentValidation.name
            ]({
              values,
              fieldName,
              message: currentValidation.message,
              comparatorFieldName: currentValidation.comparatorFieldName,
            });

            if (builtInValidationMessage !== "") {
              return [...validationMessages, builtInValidationMessage];
            }

            return validationMessages;
          } else {
            throw new Error(
              `Built in validation '${currentValidation.name}' for field: '${fieldName}' does not exist`,
            );
          }
        },
        [],
      )
    : [];
};

const getFieldValidationMessages = ({ values, validation, fieldName }) => {
  const builtInValidationMessages = getBuiltInValidationMessages({
    values,
    validation,
    fieldName,
  });
  const customValidationMessages = getCustomValidationMessages({
    values,
    validation,
    fieldName,
  });

  return [...builtInValidationMessages, ...customValidationMessages];
};

const getModelValidationMessages = ({
  values,
  validation,
  fieldName,
  modelValidationMessages,
}) => {
  const fieldValidationMessages = getFieldValidationMessages({
    values,
    validation,
    fieldName,
    modelValidationMessages,
  });
  return [...fieldValidationMessages, ...modelValidationMessages];
};

const isModelValid = ({ values, validation }) => {
  let modelValidationMessages = [];
  for (let fieldName in values) {
    modelValidationMessages = getModelValidationMessages({
      values,
      validation: validation[fieldName],
      fieldName,
      modelValidationMessages,
    });
  }

  return modelValidationMessages.length === 0 ? true : false;
};

const getDefaultValidationsObject = () => {
  return {
    customValidations: [],
    buildInValidations: [],
  };
};

const BuildFormModel = (modelValues) => {
  if (!modelValues) {
    throw new Error(
      "No values have been set for this form, please send them as an object parameter",
    );
  }

  const model = {
    values: modelValues,
    validation: {},
    isModelValid: false,
  };

  // TODO: Think about if abstracting these will pay off
  const builder = {
    addCustomValidationToField: ({ fieldName, validation }) => {
      const existingFieldValidation =
        model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {
        ...model.validation,
        [fieldName]: {
          customValidations: [
            ...existingFieldValidation.customValidations,
            validation,
          ],
          buildInValidations: [...existingFieldValidation.buildInValidations],
          shouldValidationUpdate: false,
        },
      };

      return model;
    },
    addCustomValidationsToField: ({ fieldName, validations }) => {
      const existingFieldValidation =
        model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {
        ...model.validation,
        [fieldName]: {
          customValidations: [
            ...existingFieldValidation.customValidations,
            ...validations,
          ],
          buildInValidations: [...existingFieldValidation.buildInValidations],
          shouldValidationUpdate: false,
        },
      };

      return model;
    },
    addBuiltInValidationToField: ({ fieldName, validation }) => {
      const existingFieldValidation =
        model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {
        ...model.validation,
        [fieldName]: {
          buildInValidations: [
            ...existingFieldValidation.buildInValidations,
            validation,
          ],
          customValidations: [...existingFieldValidation.customValidations],
          shouldValidationUpdate: false,
        },
      };

      return model;
    },
    addBuiltInValidationsToField: ({ fieldName, validations }) => {
      const existingFieldValidation =
        model.validation[fieldName] || getDefaultValidationsObject();
      model.validation = {
        ...model.validation,
        [fieldName]: {
          buildInValidations: [
            ...existingFieldValidation.buildInValidations,
            ...validations,
          ],
          customValidations: [...existingFieldValidation.customValidations],
          shouldValidationUpdate: false,
        },
      };

      return model;
    },
    setModelInitialValidityState: (validationInitialState) => {
      model.isModelValid = validationInitialState;

      return model;
    },
  };

  Object.setPrototypeOf(model, builder);

  return model;
};

export { getValidationForField, isModelValid, BuildFormModel };
