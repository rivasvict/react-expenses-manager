import React, { useState } from 'react';

function FormValidation({ isFormValid = false, render }) {
  const [ formState, setFormState ] = useState({ isFormValid });

  function checkForValidity() {
    return function(validationMessage) {
      if (validationMessage) {
        setFormState({ isFormValid: false });
      } else {
        setFormState({ isFormValid: true })
      }
    }
  }

  return (
    <form>{render({ ...formState, checkForValidity })}</form>
  )
}

export default FormValidation;