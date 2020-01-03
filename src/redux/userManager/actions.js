export const CREATE_USER_LOADING = 'CREATE_USER_LOADING';
export const HAS_USER_BEEN_CREATED = 'HAS_USER_BEEN_CREATED ';
export const HAS_ERRORED = 'HAS_ERRORED';

export const isLoading = isLoadingHappening => ({
  type: CREATE_USER_LOADING,
  payload: { isLoading: isLoadingHappening }
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
  return async (dispatch) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const url = `${baseUrl}/api/user/sign-up`;
      const body = JSON.stringify({ user: userPayload });
      dispatch(isLoading(true));
      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body
      });
      const response = await rawResponse.json()
      if (!rawResponse.ok) {
        dispatch(isLoading(false));
        throw response;
      }

      dispatch(isLoading(false));
      dispatch(hasUserBeenCreated(userPayload));
    } catch (error) {
      dispatch(hasErrored(error));
    }
  }
}