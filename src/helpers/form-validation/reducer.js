import { SET_VALIDITY } from './actions';

const validationReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_VALIDITY :
      return { isValidForm: payload };
    default:
      return state
  }
};

export default validationReducer;