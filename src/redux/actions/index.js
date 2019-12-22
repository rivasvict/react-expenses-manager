export const ADD_OUTCOME = 'ADD_OUTCOME';
export const ADD_INCOME = 'ADD_INCOME';
export const CATEGORY_CHANGE = 'CATEGORY_CHANGE'
export const IS_LOADING = 'IS_LOADING';
export const HAS_USER_BEEN_CREATED = 'HAS_USER_BEEN_CREATED ';

export const addOutcome = expense => ({
  type: ADD_OUTCOME, payload: expense
});

export const addIncome = income => ({
  type: ADD_INCOME,
  payload: income
});

export const categoryChange = categoryValue => ({
  type: CATEGORY_CHANGE,
  payload: categoryValue
})

export const isLoading = isLoadingHappening => ({
  type: IS_LOADING,
  payload: isLoadingHappening
})

export const hasErrored = error => ({
  type: IS_LOADING,
  payload: error
})

export const hasUserBeenCreated = () => ({
  type: HAS_USER_BEEN_CREATED,
  payload: true
});

export const createUser = (userPayload) => {
  return async (dispatch, getState) => {
    const baseUrl = process.env.REACT_APP_API_URL;
    const url = `${baseUrl}/api/user/sign-up`;
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(userPayload)
    })
    debugger;
  }
}