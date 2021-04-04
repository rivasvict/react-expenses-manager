import React, { useReducer } from 'react';
import validationReducer from './reducer';
import { setFormValue } from './actions';
const ValidationContext = React.createContext();

const getFormStateChangeDispatcher = (dispatch) => ({ name, value }) => dispatch(setFormValue({ name, value }));

function FormValidation({ render, formModel, className = '', CustomFormComponent = null }) {
  const [ formState, dispatch ] = useReducer(validationReducer, formModel);
  const dispatchFormStateChange = getFormStateChangeDispatcher(dispatch)

  return (
    <ValidationContext.Provider
      value={{
        formState,
        dispatch,
        dispatchFormStateChange
      }}>
      {CustomFormComponent ?
        <CustomFormComponent className={className}>{render({ dispatch, formState, dispatchFormStateChange })}</CustomFormComponent> :
        <form className={className}>{render({ dispatch, formState, dispatchFormStateChange })}</form>
      }
    </ValidationContext.Provider>
  )
}

export { ValidationContext, FormValidation };