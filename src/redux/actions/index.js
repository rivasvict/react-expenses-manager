export const ADD_OUTCOME = 'ADD_OUTCOME';
export const ADD_INCOME = 'ADD_INCOME';

export const addOutcome = expense => ({
  type: ADD_OUTCOME,
  payload: expense
});

export const addIncome = income => ({
  type: ADD_INCOME,
  payload: income
});