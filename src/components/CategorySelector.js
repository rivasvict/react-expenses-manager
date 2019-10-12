import React from 'react';

function CategorySelector({ handleChange, name, value, categoryOptions }) {
    return (
        <select name={name} value={value} onChange={handleChange}>
            <option value=''></option>
            {categoryOptions.map((categoryOption, key) => <option value={categoryOption.value} key={key}>{categoryOption.name}</option>)}
        </select>
    )
}

export default CategorySelector;