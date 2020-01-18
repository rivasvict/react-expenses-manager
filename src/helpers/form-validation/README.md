# WIP

# Validation form component

A simple way to use form validation with a model.

## How to use

1. Create the form model on your component

```javascript
  const userModel = {
    values: { // (required) Form state
      firstName: '',
      lastName: '',
      email: '',
      password: ''
    },
    validation: { // (Required) The object properties names should match the ones on the form state
      firstName: {
        customValidations: [ // Here you place all custom validations you need. These should be an array of functions that either return an empty sting (Valid) or a string message (Invalid)
          (value) => value === '' ? 'First validation' : '',
          (value) => value === '' ? 'Second validation' : ''
        ],
        buildInValidations: [ // Here you place an array of objects that have ONLY two properties name (Name of the built in validation) and message (When the built in validation fails).
          { name: 'required', message: 'TEST MESSAGE' }
        ]
      },
      lastName: {
        customValidations: [],
        buildInValidations: [{ name: 'required', message: 'TEST MESSAGE' }]
      },
      email: {
        customValidations: [],
        buildInValidations: []
      },
      password: {
        customValidations: [],
        buildInValidations: []
      }
    },
    isModelValid: false // Required
  }
```

2. Then you call form validation with 3 rpops:

   * `formModel`: The form model you have previously created
   * `render`: The wrapper that will allow your form fields to render

  ```javascript
    <FormValidation formModel={userModel} render={({ dispatch, formState }) => { // Render should receive dispatch and formState
      return (
        <React.Fragment>
          {formState.isModelValid ? 'VALID' : 'INVALID'}
          <label>First Name: </label>
          <ValidateField 
            validationTypes={[{ name: 'required', message: 'TEST MESSAGE' }]}
            value={formState.values.firstName}
            fieldName={'firstName'}>

            <input type='text' name='firstName' placeholder='First Name goes here' onChange={(event) => handleChange({ event, dispatch, formState })}></input>
          </ValidateField>
          {props.validationErrors.find(validationError => validationError.path === 'firstName') ? <React.Fragment><br /><label>First name is required</label></React.Fragment> : null}
          <br /><label>Last Name: </label>
          <ValidateField
            validationTypes={[{ name: 'required', message: 'TEST MESSAGE' }]}
            value={formState.values.lastName}
            fieldName={'lastName'}>

            <input type='text' name='lastName' placeholder='Last Name goes here' onChange={(event) => handleChange({ event, dispatch, formState })}></input>
          </ValidateField>
          {props.validationErrors.find(validationError => validationError.path === 'lastName') ? <React.Fragment><br /><label>Last name is required</label></React.Fragment> : null}
          <br /><label>Email: </label><input type='text' name='email' placeholder='Your email goes here'  onChange={(event) => handleChange({ event, dispatch, formState })}></input>
          {props.validationErrors.find(validationError => validationError.path === 'email') ? <React.Fragment><br /><label>Email is required</label></React.Fragment> : null}
          <br /><label>Password: </label><input type='password' name='password' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatch, formState })}></input>
          {props.validationErrors.find(validationError => validationError.path === 'password') ? <React.Fragment><br /><label>Password is required</label></React.Fragment> : null}
          <br /><label>Retype password: </label><input type='password' name='password-retype' placeholder='Type password'  onChange={(event) => handleChange({ event, dispatch, formState })}></input>
          <br />{props.isLoading ? 'loading...' : <button type='submit' onClick={handleSubmit}>Submit</button>}
          <button onClick={handleCancel}>Cancel</button>
        </React.Fragment>
      )
    }}/>
  ```