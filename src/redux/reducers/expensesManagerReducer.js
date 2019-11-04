import { ADD_EXPENSE } from '../actions/index';

const initialState = {
  entries: {
    incomes: [],
    outcomes: []
  }
}

export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_EXPENSE:
      return action.payload;
    default:
      return state;
  }
}
