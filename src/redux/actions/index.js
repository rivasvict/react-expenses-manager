export const ADD_OUTCOME = 'ADD_OUTCOME';
export const ADD_INCOME = 'ADD_INCOME';
export const CATEGORY_CHANGE = 'CATEGORY_CHANGE'
export const IS_LOADING = 'IS_LOADING';
export const HAS_USER_BEEN_CREATED = 'HAS_USER_BEEN_CREATED ';
export const HAS_ERRORED = 'HAS_ERRORED';

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
  type: HAS_ERRORED,
  payload: error
})

// TODO: Choose a better action name
export const hasUserBeenCreated = user => ({
  type: HAS_USER_BEEN_CREATED,
  payload: user
});

// TODO: Handle loading state
export const createUser = (userPayload) => {
  return async (dispatch, getState) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const url = `${baseUrl}/api/user/sign-up`;
      const body = JSON.stringify({ user: userPayload });
      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body
      });
      const response = await rawResponse.json()
      if (!rawResponse.ok) {
        throw new Error(response.message)
      }

      dispatch(hasUserBeenCreated(userPayload));
    } catch (error) {
      dispatch(hasErrored(error));
    }
  }
}