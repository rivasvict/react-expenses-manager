import _ from 'lodash';
import { getCurrentMonth, getCurrentYear } from '../../helpers/date';

import { ADD_OUTCOME, ADD_INCOME, CATEGORY_CHANGE, GET_BALANCE, SET_SELECTED_DATE } from './actions';

const initialState = {
  entries: {
  },
  category: '',
  selectedDate: {
    // Current month and year by default
    // So the app is always up to date
    // when it first load
    month: getCurrentMonth(),
    year: getCurrentYear()
  }
}

const getEntryWithCalculableAmount = entry => (
  { amount: parseFloat(entry.amount), ..._.omit(entry, 'amount') }
);

const addEntry = ({ entry, entryType, state, selectedDate }) => {
  const selectedYear = selectedDate.year;
  const selectedMonth = selectedDate.month;
  const entryWithCalculableAmount = getEntryWithCalculableAmount(entry);
  const entriesToInsert = [...state.entries[selectedYear][selectedMonth][entryType], entryWithCalculableAmount];
  const newState = _.chain({}).merge(state).merge({
    entries: {
      [selectedYear]: {
        [selectedMonth]: {
          [entryType]: entriesToInsert
        }
      }
    }
  }).value();
  return newState;
};

const changeCategory = ({ categoryValue, currentState}) => {
  return { ...currentState, category: categoryValue };
};

const changeSelectedDate = ({ newSelectedDateValue, currentState }) =>{
  return { ...currentState, selectedDate: newSelectedDateValue };
};

export const reducer = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case ADD_OUTCOME: return addEntry({
        entry: payload.entry,
        selectedDate: payload.selectedDate,
        entryType: 'expenses',
        state
      });
    case ADD_INCOME: return addEntry({
        entry: payload.entry,
        selectedDate: payload.selectedDate,
        entryType: 'incomes',
        state
      });
    case CATEGORY_CHANGE: return changeCategory({ categoryValue: payload, currentState: state });
    case GET_BALANCE: return {
      ...state,
      entries: {
        ...state.entries,
        ...payload.entries
      }
    };
    case SET_SELECTED_DATE: return changeSelectedDate({
      newSelectedDateValue: payload,
      currentState: state
    });
    default:
      return state;
  }
}