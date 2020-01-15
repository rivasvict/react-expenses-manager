export const SET_VALIDITY = 'SET_VALIDITY';

export const setValidity = ({ isValidForm }) => {
  return {
    type: SET_VALIDITY,
    payload: isValidForm
  }
};