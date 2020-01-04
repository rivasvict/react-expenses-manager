export const ADD_OUTCOME = 'ADD_OUTCOME';
export const ADD_INCOME = 'ADD_INCOME';
export const CATEGORY_CHANGE = 'CATEGORY_CHANGE'

const addOutcome = expense => ({
  type: ADD_OUTCOME, payload: expense
});

const addIncome = income => ({
  type: ADD_INCOME,
  payload: income
});

const categoryChange = categoryValue => ({
  type: CATEGORY_CHANGE,
  payload: categoryValue
})

export const ActionCreators = () => ({
  addOutcome,
  addIncome,
  categoryChange
});