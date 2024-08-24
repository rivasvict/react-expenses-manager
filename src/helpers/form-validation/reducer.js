import { SET_FORM_VALUE } from "./actions";
import { isModelValid } from "./helpers";

const formReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_FORM_VALUE:
      const { name, value } = payload;
      const newValues = {
        ...state.values,
        [name]: value,
      };
      return {
        ...state,
        values: newValues,
        isModelValid: isModelValid({
          validation: state.validation,
          values: newValues,
        }),
        validation: {
          ...state.validation,
          [name]: {
            ...state.validation[name],
            shouldValidationUpdate: true,
          },
        },
      };
    default:
      return state;
  }
};

export default formReducer;
