export const CREATE_USER_LOADING = 'CREATE_USER_LOADING';
export const CREATE_USER_SUCCESS = 'CREATE_USER_SUCCESS';
export const CREATE_USER_ERROR = 'CREATE_USER_ERROR';
export const USER_LOG_IN_LOADING = 'USER_LOG_IN_LOADING';
export const USER_LOG_IN_ERROR = 'USER_LOG_IN_ERROR';
export const USER_LOG_IN_SUCCESS = 'USER_LOG_IN_SUCCESS';

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

const userLoginLoading = isUserLoginLoadingHappening => ({
  type: USER_LOG_IN_LOADING,
  payload: { userLoginLoading: isUserLoginLoadingHappening }
})

const userLoginSuccess = user => ({
  type: USER_LOG_IN_SUCCESS,
  payload: user
})

const userLoginError = error => ({
  type: USER_LOG_IN_ERROR,
  payload: error
})

const notifyUserCreation = dispatch => {
  dispatch(hasUserBeenCreated(true));
  dispatch(hasUserBeenCreated(false));
};

const CreateUser = () => (userPayload) => {
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
      notifyUserCreation(dispatch);
    } catch (error) {
      dispatch(userCreationFail(error));
    }
  }
}

const LogIn = () => (userPayload) => {
  return async (dispatch) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL;
      const url = `${baseUrl}/api/user/login`;
      const body = JSON.stringify({ user: userPayload });
      dispatch(userLoginLoading(true));
      const rawResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      const response = await rawResponse.json()
      if (!rawResponse.ok) {
        dispatch(userLoginLoading(false));
        throw response;
      }

      dispatch(userLoginLoading(false));
      dispatch(userLoginSuccess(response));
    } catch (error) {
      dispatch(userLoginError(error));
    }
  }
};

export const ActionCreators = () => ({
  createUser: CreateUser(),
  logIn: LogIn()
});