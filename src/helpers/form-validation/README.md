# WIP

# Form validation component

A simple way to use form validation with a model.

## How to use

Within the component you want to use validation in:

1. Import this package

```javascript
import { FormValidation, FormModel, ValidateField } from '../../helpers/form-validation/'
```

1. Create the form model on your component

```javascript
  const userModel = FormModel({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
    .addCustomValidationToField({ fieldName: 'firstName', validation: (value) => value === '' ? 'First validation' : ''  })
    .addCustomValidationsToField({ fieldName: 'firstName', validations: [(value) => value === '' ? 'Second validation' : '', (value) => value === '' ? 'Third validation' : ''] })
    .addBuiltInValidationToField({ fieldName: 'firstName', validation: { name: 'required', message: 'A simple custom message' }})
    .addBuiltInValidationsToField({ fieldName: 'firstName', validations: [{ name: 'required', message: 'A simple custom message' }, { name: 'required', message: 'A simple custom message' }]})
    .setModelInitialValidityState(false);
```

2. Then you call form validation with 2 props:

   * `formModel`: The form model you have previously created.
   * `render`: The render prop wrapper that will allow you to use your form as simple input fields. This also provides you with a function for dispatching changes to the form model we previously created and the form/model state.

  ```javascript
    <FormValidation formModel={userModel} render={({ dispatchFormStateChange, formState }) => {
      return (
        <React.Fragment>
          <label>First Name: </label>
          <ValidateField>
            <input type='text' name='firstName' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br /><label>Last Name: </label>
          <ValidateField>
            <input type='text' name='lastName' placeholder='Last Name goes here' onChange={(event) => handleChange({ event, dispatchFormStateChange })}></input>
          </ValidateField>
          <br /><button type='submit' disabled={!formState.isModelValid} onClick={handleSubmit}>Submit</button>
        </React.Fragment>
      )
    }}/>
  ```

3. Set handleChange or any other event to update the state of the form

```javascript
  function handleChange({ event, dispatchFormStateChange }) {
    const { name, value } = event.currentTarget;
    dispatchFormStateChange({ name, value });
  };
```

That's it, you should be all set!

## Model builder API

TODO

## Components explanation and props

TODO