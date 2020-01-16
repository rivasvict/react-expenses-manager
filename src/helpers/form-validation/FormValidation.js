import React, { useReducer } from 'react';
import validationReducer from './reducer';
const ValidationContext = React.createContext();

function FormValidation({ render, formModel }) {
  // TODO: Construct the validation messages object to capture the validation state
  // Use for in for this
  const [formState, dispatch] = useReducer(validationReducer, formModel);

  return (
    <ValidationContext.Provider value={{ formState, dispatch }}>
      <form>{render({ dispatch, formState })}</form>
    </ValidationContext.Provider>
  )
}

export default FormValidation;
export { ValidationContext };