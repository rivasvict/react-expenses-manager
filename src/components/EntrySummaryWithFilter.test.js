import React from 'react';
import EntrySummaryWithFilter from './EntrySummaryWithFilter';
import { rennder, unmountComponentAtNode } from 'react-dom';
import renderer from 'react-test-renderer';
import { isTSAnyKeyword } from '@babel/types';

describe('EntrySummaryWithFilter', () => {
  it('snapshot: should always render the same component', () => {
    const tree = renderer
      .create(<EntrySummaryWithFilter />)
  })
})