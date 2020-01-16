import { SET_FORM_VALUE } from './actions';

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
    default:
      return state
  }
};

export default formReducer;