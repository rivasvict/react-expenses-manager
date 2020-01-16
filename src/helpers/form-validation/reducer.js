import { SET_FORM_VALUE, SET_FORM_VALIDITY } from './actions';
import { getModelValidity } from './helpers';

const formReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_FORM_VALUE :
      const { name, value } = payload;
      const newValues = {
        ...state.values,
        [name]: value
      }
      return {
        ...state,
        values: newValues,
        isModelValid: getModelValidity({ validation: state.validation, values: newValues })
      };
    default:
      return state
  }
};

export default formReducer;