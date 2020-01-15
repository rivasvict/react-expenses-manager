import React, { useReducer } from 'react';
import validationReducer from './reducer';
const ValidationContext = React.createContext();

function FormValidation({ children }) {
  const [state, dispatch] = useReducer(validationReducer, { isValidForm: false });

  return (
    <ValidationContext.Provider value={{ state, dispatch }}>
      <form>{children}</form>
    </ValidationContext.Provider>
  )
}

export default FormValidation;
export { ValidationContext };