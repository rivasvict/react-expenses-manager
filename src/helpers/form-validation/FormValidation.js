import React, { useReducer } from 'react';
import validationReducer from './reducer';
import { setFormValue } from './actions';
import { Form } from 'react-bootstrap';
import { FormContent } from '../../components/common/Forms';
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
        <FormContent className={className} render={() => (render({ dispatch, formState, dispatchFormStateChange }))}/>
      }
    </ValidationContext.Provider>
  )
}

export { ValidationContext, FormValidation };