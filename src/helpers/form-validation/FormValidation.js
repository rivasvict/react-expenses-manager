import React, { useReducer } from 'react';
import validationReducer from './reducer';
import { setFormValue } from './actions';
import { BuildFormModel } from './helpers';
const ValidationContext = React.createContext();

const getFormStateChangeDispatcher = (dispatch) => ({ name, value }) => dispatch(setFormValue({ name, value }));

function FormValidation({ render, formModel }) {
  const [ formState, dispatch ] = useReducer(validationReducer, formModel);
  const dispatchFormStateChange = getFormStateChangeDispatcher(dispatch)

  return (
    <ValidationContext.Provider
      value={{
        formState,
        dispatch,
        dispatchFormStateChange
      }}>
      <form>{render({ dispatch, formState, dispatchFormStateChange })}</form>
    </ValidationContext.Provider>
  )
}

export default FormValidation;
export { ValidationContext, BuildFormModel as FormModel };