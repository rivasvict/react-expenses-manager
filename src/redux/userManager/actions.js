export const CREATE_USER_LOADING = 'CREATE_USER_LOADING';
export const CREATE_USER_SUCCESS = 'CREATE_USER_SUCCESS';
export const CREATE_USER_ERROR = 'CREATE_USER_ERROR';

const userCreationLoading = isUserCreationLoadingHappening => ({
  type: CREATE_USER_LOADING,
  payload: { userCreationLoading: isUserCreationLoadingHappening }
})

const userCreationFail = error => ({
  type: CREATE_USER_ERROR,
  payload: error
})

const hasUserBeenCreated = user => ({
  type: CREATE_USER_SUCCESS,
  payload: user
});

const CreateUser = history => (userPayload) => {
  return async (dispatch) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const url = `${baseUrl}/api/user/sign-up`;
      const body = JSON.stringify({ user: userPayload });
      dispatch(userCreationLoading(true));
      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      const response = await rawResponse.json()
      if (!rawResponse.ok) {
        dispatch(userCreationLoading(false));
        throw response;
      }

      dispatch(userCreationLoading(false));
      dispatch(hasUserBeenCreated(userPayload));
      // TODO: Change this to be a responsibility
      // of either the component that dispatches
      // this action or <Redirect> component of
      // React router
      history.push('/');
    } catch (error) {
      dispatch(userCreationFail(error));
    }
  }
}

export const ActionCreators = history => ({
  createUser: CreateUser(history)
});