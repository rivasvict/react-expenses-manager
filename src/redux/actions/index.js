export const ADD_EXPENSE = 'ADD_EXPENSE';

export const castHolaAction = expense => ({
  type: ADD_EXPENSE,
  payload: expense
});
