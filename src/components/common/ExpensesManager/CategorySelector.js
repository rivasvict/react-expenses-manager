import React from 'react';
import { FormSelect } from '../Forms';

function CategorySelector({ handleChange, name, value, categoryOptions }) {
  return (
    <FormSelect name={name} value={value} onChange={handleChange}>
      <option value=''></option>
      { /** TODO: Revise the set up of the categoryOption.value at this point
       * Probably a good idea not to make the frontend take care of the logic of the ,, */ }
      {categoryOptions.map((categoryOption, key) => <option value={`,${categoryOption.value},`} key={key}>{categoryOption.name}</option>)}
    </FormSelect>
  );
};

export default CategorySelector;
