import React from 'react';
import AddLink from './AddLink';
import renderer from 'react-test-renderer';

it('Renders AddLink component properly', () => {
  const tree = renderer
    .create(<AddLink>A test link</AddLink>)
    .toJSON();

  expect(tree).toMatchSnapshot();
})
