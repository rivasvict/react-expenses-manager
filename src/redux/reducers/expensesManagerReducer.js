import _ from 'lodash';

import { ADD_OUTCOME, ADD_INCOME, CATEGORY_CHANGE } from '../actions/index';

const initialState = {
  entries: {
    incomes: [],
    outcomes: []
  },
  category: ''
}

const addEntry = ({ entry, entryType, state }) => {
  const entriesToInsert = [...state.entries[entryType], entry];
  const newState = _.chain({}).merge(state).merge({entries: {[entryType]: entriesToInsert}}).value();
  return newState;
};

const categoryChange = ({ categoryValue, currentState}) => {
  return { ...currentState, category: categoryValue };
};

export const reducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_OUTCOME: return addEntry({
        entry: payload,
        entryType: 'outcomes',
        state
      });
    case ADD_INCOME: return addEntry({
        entry: payload,
        entryType: 'incomes',
        state
      });
    case CATEGORY_CHANGE: return categoryChange({ categoryValue: payload, currentState: state });
    default:
      return state;
  }
}