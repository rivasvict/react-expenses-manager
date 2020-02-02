import { CREATE_USER_ERROR, CREATE_USER_SUCCESS, CREATE_USER_LOADING, USER_LOG_IN_LOADING, USER_LOG_IN_ERROR, USER_LOG_IN_SUCCESS } from "./actions";
const defaultState = { user: {}, token: null, validationErrors: { validation: [] }, isLoading: false, error: null }

const handleError = (error, state) => {
  if (error && error.name === 'ValidationError') {
    return {
      ...state,
      validationErrors: {
        validation: error.validation
      }
    }
  }

  return {
    ...state,
    error
  }
};

export const reducer = (state = defaultState, action) => {
  const { type, payload } = action;

  switch (type) {
    case CREATE_USER_ERROR: return handleError(payload, state);
    case CREATE_USER_SUCCESS: return {
      ...state,
      user: payload.user
    };
    case CREATE_USER_LOADING: return {
      ...state,
      isLoading: payload.isLoading
    };
    //TODO: REVISIT USER_LOG_IN REDUCERS
    case USER_LOG_IN_ERROR: return handleError(payload, state);
    case USER_LOG_IN_SUCCESS: return {
      ...state,
      user: payload.user,
      token: payload.token
    }
    case USER_LOG_IN_LOADING: return {
      ...state,
      isLoading: payload.isLoading
    };
    default: return state;
  }
}