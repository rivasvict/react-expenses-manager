export const CREATE_USER_LOADING = 'CREATE_USER_LOADING';
export const CREATE_USER_SUCCESS = 'CREATE_USER_SUCCESS';
export const CREATE_USER_ERROR = 'CREATE_USER_ERROR';

export const userCreationLoading = isUserCreationLoadingHappening => ({
  type: CREATE_USER_LOADING,
  payload: { userCreationLoading: isUserCreationLoadingHappening }
})

export const userCreationFail = error => ({
  type: CREATE_USER_ERROR,
  payload: error
})

export const hasUserBeenCreated = user => ({
  type: CREATE_USER_SUCCESS,
  payload: user
});

export const createUser = (userPayload) => {
  return async (dispatch) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const url = `${baseUrl}/api/user/sign-up`;
      const body = JSON.stringify({ user: userPayload });
      dispatch(userCreationLoading(true));
      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body
      });
      const response = await rawResponse.json()
      if (!rawResponse.ok) {
        dispatch(userCreationLoading(false));
        throw response;
      }

      dispatch(userCreationLoading(false));
      dispatch(hasUserBeenCreated(userPayload));
    } catch (error) {
      dispatch(userCreationFail(error));
    }
  }
}