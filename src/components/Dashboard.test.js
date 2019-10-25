import React from 'react';
import Dashboard from './Dashboard';
import renderer from 'react-test-renderer';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route } from 'react-router-dom';
// TODO: Test routes

describe('Dashboard component test', () => {
  let jsDomTree = null;
  let DashboardInstance = null;
  let newEntry = null;

  beforeEach(() => {
    const tree = renderer
      .create(<MemoryRouter initialEntries={['/']}><Route component={Dashboard} path='/'></Route></MemoryRouter>);
    jsDomTree = tree.toJSON();
    DashboardInstance = tree.root.findByType(Dashboard).instance;
    newEntry = {
      ammount: '12',
      description: 'fwwr',
      type: 'income',
      category: 'salary'
    };
  });

  it('Renders Dashboard component properly', () => {
    expect(jsDomTree).toMatchSnapshot();
  });

  it('addEntry: Add new entry to state', () => {
    act(() => {
      DashboardInstance.addEntry(newEntry, 'incomes');
      DashboardInstance.addEntry(newEntry, 'incomes');
    });

    expect(DashboardInstance.state.entries.incomes.length).toBe(2);
    expect(DashboardInstance.state.entries.incomes).toStrictEqual([ newEntry, newEntry ]);
  })

  it('addIncome: should add new income to the state outcomes', () => {
    act(() => {
      DashboardInstance.addIncome(newEntry);
      DashboardInstance.addIncome(newEntry);
    });

    expect(DashboardInstance.state.entries.incomes.length).toBe(2);
    expect(DashboardInstance.state.entries.incomes).toStrictEqual([ newEntry, newEntry ]);
  })
  
  it('addOutcome: should add new outcome to the state outcomes', () => {
    act(() => {
      DashboardInstance.addOutcome(newEntry);
      DashboardInstance.addOutcome(newEntry);
    });

    expect(DashboardInstance.state.entries.outcomes.length).toBe(2);
    expect(DashboardInstance.state.entries.outcomes).toStrictEqual([ newEntry, newEntry ]);
  })

  it('getSum: should get the correct sum for entries added', () => {
    act(() => {
      DashboardInstance.addOutcome(newEntry);
      DashboardInstance.addOutcome(newEntry);
      DashboardInstance.addOutcome(newEntry);
      DashboardInstance.addOutcome(newEntry);
    });

    const totalSum = DashboardInstance.getSum('outcomes');
    expect(totalSum).toBe(parseInt(newEntry.ammount) * 4);
  })
})
