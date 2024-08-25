import React from "react";
import CategorySelector from "./CategorySelector";
import renderer from "react-test-renderer";

it("Renders CategorySelector component properly", () => {
  const tree = renderer
    .create(
      <CategorySelector
        handleChange={jest.fn()}
        name="CategorySelector"
        value=""
        categoryOptions={[
          { name: "Cat1", value: "cat1" },
          { name: "Cat2", value: "cat2" },
        ]}
      />,
    )
    .toJSON();

  expect(tree).toMatchSnapshot();
});
