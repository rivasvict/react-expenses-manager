import React, { useMemo } from "react";
import CategorySearchSelect from "../CategorySearchSelect";

/**
 * Thin adapter around CategorySearchSelect that keeps the historical
 * CategorySelector contract: `handleChange` still receives an event-like
 * object exposing `currentTarget.value`/`currentTarget.name`, and values
 * keep the load-bearing `,category,` format ("" for the empty option).
 */
const CategorySelector = ({
  handleChange,
  name,
  value,
  categoryOptions,
  className = "",
  id,
  emptyOptionLabel,
}) => {
  /** TODO: Revise the set up of the categoryOption.value at this point
   * Probably a good idea not to make the frontend take care of the logic of the ,, */
  const options = useMemo(
    () =>
      categoryOptions.map((categoryOption) => ({
        value: `,${categoryOption.value},`,
        label: categoryOption.name,
      })),
    [categoryOptions]
  );

  return (
    <CategorySearchSelect
      className={className}
      id={id}
      name={name}
      value={value || ""}
      options={options}
      emptyOptionLabel={emptyOptionLabel || `All ${name}`}
      onChange={(newValue) =>
        handleChange({ currentTarget: { value: newValue, name } })
      }
    />
  );
};

export default CategorySelector;
