import _ from 'lodash';

import { ADD_OUTCOME, ADD_INCOME, CATEGORY_CHANGE } from './actions';

const initialState = {
  entries: {
    incomes: [],
    outcomes: []
  },
  category: ''
}

const getEntryWithCalculableAmount = (entry, entryType) => {
  const calculableAmount = entryType === 'incomes' ? parseInt(entry.ammount) : parseInt(`-${entry.ammount}`);

  return { ammount: calculableAmount, ..._.omit(entry, 'ammount') };
};

const addEntry = ({ entry, entryType, state }) => {
  const entryWithCalculableAmount = getEntryWithCalculableAmount(entry, entryType);
  const entriesToInsert = [...state.entries[entryType], entryWithCalculableAmount];
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