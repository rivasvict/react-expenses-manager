import { SET_FORM_VALUE, SET_FORM_VALIDITY } from './actions';

const formReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_FORM_VALUE :
      const { name, value } = payload;
      return {
        ...state,
        values: {
          ...state.values,
          [name]: value
        }
      };
    case SET_FORM_VALIDITY :
      return {
        ...state,
        isModelValid: !state.isModelValid
      }
    default:
      return state
  }
};

export default formReducer;