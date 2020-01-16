export const SET_FORM_VALUE = 'SET_FORM_VALUE';
export const SET_FORM_VALIDITY = 'SET_FORM_VALIDITY';

export const setFormValue = (newFormValue) => {
  return {
    type: SET_FORM_VALUE,
    payload: newFormValue
   };
};

export const setFormValidity = (values) => {
  return {
    type: SET_FORM_VALIDITY,
    payload: values
  }
}