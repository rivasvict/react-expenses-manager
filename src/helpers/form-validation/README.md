# WIP

# Validation form component

A simple way to use form validation with a model.

## How to use

Within the component you want to use validation:

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

2. Then you call form validation with 3 rpops:

   * `formModel`: The form model you have previously created
   * `render`: The wrapper that will allow your form fields to render

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
          <br />{props.isLoading ? 'loading...' : <button type='submit' onClick={handleSubmit}>Submit</button>}
          <button onClick={handleCancel}>Cancel</button>
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