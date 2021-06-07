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

  it('addIncome: should add new income to the state expenses', () => {
    act(() => {
      DashboardInstance.addIncome(newEntry);
      DashboardInstance.addIncome(newEntry);
    });

    expect(DashboardInstance.state.entries.incomes.length).toBe(2);
    expect(DashboardInstance.state.entries.incomes).toStrictEqual([ newEntry, newEntry ]);
  })
  
  it('addExpense: should add new expense to the state expenses', () => {
    act(() => {
      DashboardInstance.addExpense(newEntry);
      DashboardInstance.addExpense(newEntry);
    });

    expect(DashboardInstance.state.entries.expenses.length).toBe(2);
    expect(DashboardInstance.state.entries.expenses).toStrictEqual([ newEntry, newEntry ]);
  })

  it.only('getSum: should get the correct sum for entries added', () => {
    act(() => {
      DashboardInstance.addExpense(newEntry);
      DashboardInstance.addExpense(newEntry);
      DashboardInstance.addExpense(newEntry);
      DashboardInstance.addExpense(newEntry);
    });

    const totalSum = DashboardInstance.getSum('expenses');
    expect(totalSum).toBe(parseInt(newEntry.ammount) * 4);
  })
})
