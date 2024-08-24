export const SET_FORM_VALUE = "SET_FORM_VALUE";

export const setFormValue = (newFormValue) => {
  return {
    type: SET_FORM_VALUE,
    payload: newFormValue,
  };
};
