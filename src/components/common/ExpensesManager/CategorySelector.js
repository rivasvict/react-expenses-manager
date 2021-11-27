import React from 'react';

function CategorySelector({ handleChange, name, value, categoryOptions }) {
  return (
    <select name={name} value={value} onChange={handleChange}>
      <option value=''></option>
      { /** TODO: Revise the set up of the categoryOption.value at this point
       * Probably a good idea not to make the frontend take care of the logic of the ,, */ }
      {categoryOptions.map((categoryOption, key) => <option value={`,${categoryOption.value},`} key={key}>{categoryOption.name}</option>)}
    </select>
  );
};

export default CategorySelector;
